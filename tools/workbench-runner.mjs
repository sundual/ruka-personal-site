import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const store = join(root, ".ruka-workbench");
const dirs = {
  pending: join(store, "tasks", "pending"),
  running: join(store, "tasks", "running"),
  done: join(store, "tasks", "done"),
  failed: join(store, "tasks", "failed")
};
const logDir = join(store, "logs");
const intervalMs = Number(process.env.RUKA_RUNNER_INTERVAL_MS || 3000);

async function ensureStore() {
  await mkdir(logDir, { recursive: true });
  await Promise.all(Object.values(dirs).map((dir) => mkdir(dir, { recursive: true })));
}

function taskPath(dir, id) {
  return join(dir, `${id}.json`);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function appendLog(id, line) {
  const path = join(logDir, `${id}.log`);
  const stamp = new Date().toISOString();
  const existing = existsSync(path) ? await readFile(path, "utf8") : "";
  await writeFile(path, `${existing}[${stamp}] ${line}\n`);
}

async function moveTask(task, from, to, patch = {}) {
  const next = { ...task, ...patch, status: basename(to), updatedAt: new Date().toISOString() };
  const fromPath = taskPath(from, task.id);
  const toPath = taskPath(to, task.id);
  await writeJson(fromPath, next);
  await rename(fromPath, toPath);
  return next;
}

function runCodex(prompt) {
  return new Promise((resolveRun) => {
    const child = spawn("codex", [
      "exec",
      "--cd",
      root,
      "--sandbox",
      "danger-full-access",
      "--dangerously-bypass-approvals-and-sandbox",
      prompt
    ], {
      cwd: root,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on("close", (code) => resolveRun({ code, stdout, stderr }));
    child.on("error", (error) => resolveRun({ code: 1, stdout, stderr: error.message }));
  });
}

async function nextManualTask() {
  const pending = await readdir(dirs.pending).catch(() => []);
  for (const name of pending.filter((item) => item.endsWith(".json")).sort()) {
    const task = await readJson(join(dirs.pending, name));
    if (task.type === "manual") return task;
  }
  return null;
}

async function processTask(task) {
  let running = await moveTask(task, dirs.pending, dirs.running);
  await appendLog(task.id, "Runner started Codex task");

  const prompt = [
    running.mode === "plan"
      ? "You are handling this task in planning mode. Do not edit files or run mutating commands. Produce a concrete implementation plan for the user."
      : "You are handling this task in default execution mode. Implement the user's request when appropriate, run checks, commit, and push if public site content changes.",
    "",
    running.prompt,
    "",
    "Context:",
    "- You are working in the local ruka-personal-site repository.",
    "- The workbench page is a local browser front end over this repository and may change as part of the task.",
    "- Keep .ruka-workbench as local-only task/log data."
  ].join("\n");

  const result = await runCodex(prompt);
  await appendLog(task.id, `$ codex exec ...\n${result.stdout}${result.stderr}`.trim());

  if (result.code === 0) {
    running = await moveTask(running, dirs.running, dirs.done, {
      result: { codexExitCode: result.code }
    });
    await appendLog(task.id, "Runner completed Codex task");
    return running;
  }

  running = await moveTask(running, dirs.running, dirs.failed, {
    error: `Codex exited with code ${result.code}`
  });
  await appendLog(task.id, `Runner failed Codex task with code ${result.code}`);
  return running;
}

async function tick() {
  const task = await nextManualTask();
  if (task) {
    await processTask(task);
  }
}

await ensureStore();
console.log(`Ruka workbench runner polling every ${intervalMs}ms`);
setInterval(() => {
  tick().catch((error) => {
    console.error(error);
  });
}, intervalMs);
tick().catch((error) => {
  console.error(error);
});
