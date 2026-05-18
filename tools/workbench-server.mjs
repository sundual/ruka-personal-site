import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, timingSafeEqual } from "node:crypto";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workbenchRoot = join(root, "tools", "workbench");
const store = join(root, ".ruka-workbench");
const taskDirs = {
  pending: join(store, "tasks", "pending"),
  running: join(store, "tasks", "running"),
  done: join(store, "tasks", "done"),
  failed: join(store, "tasks", "failed")
};
const logDir = join(store, "logs");
const host = "127.0.0.1";
const port = Number(process.env.RUKA_WORKBENCH_PORT || 8787);
const sitePort = Number(process.env.RUKA_SITE_PORT || 8000);
const token = process.env.RUKA_WORKBENCH_TOKEN || randomBytes(18).toString("base64url");
const tokenWasGenerated = !process.env.RUKA_WORKBENCH_TOKEN;
let taskCreationLock = Promise.resolve();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

async function ensureStore() {
  await mkdir(logDir, { recursive: true });
  await Promise.all(Object.values(taskDirs).map((dir) => mkdir(dir, { recursive: true })));
}

function json(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function text(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sameToken(a, b) {
  const left = Buffer.from(a || "");
  const right = Buffer.from(b || "");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function requestToken(req, url) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return url.searchParams.get("token") || "";
}

function isAuthorized(req, url) {
  return sameToken(requestToken(req, url), token);
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large"));
      }
    });
    req.on("end", () => resolveBody(body));
    req.on("error", reject);
  });
}

function run(command, args, options = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: false,
      ...options
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolveRun({ code, stdout, stderr }));
    child.on("error", (error) => resolveRun({ code: 1, stdout, stderr: error.message }));
  });
}

async function gitStatus() {
  const [status, log] = await Promise.all([
    run("git", ["status", "--short", "--branch"]),
    run("git", ["log", "--oneline", "-3"])
  ]);
  return {
    status: status.stdout.trim(),
    recentCommits: log.stdout.trim()
  };
}

function taskId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  return `${stamp}-${Math.random().toString(16).slice(2, 8)}`;
}

function taskPath(dir, id) {
  return join(dir, `${id}.json`);
}

async function appendLog(id, line) {
  const path = join(logDir, `${id}.log`);
  const stamp = new Date().toISOString();
  const existing = existsSync(path) ? await readFile(path, "utf8") : "";
  await writeFile(path, `${existing}[${stamp}] ${line}\n`);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function listTasks() {
  const tasks = [];
  for (const [statusName, dir] of Object.entries(taskDirs)) {
    const names = await readdir(dir).catch(() => []);
    for (const name of names.filter((item) => item.endsWith(".json"))) {
      const task = await readJson(join(dir, name));
      tasks.push({ ...task, status: statusName });
    }
  }
  return tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function hasActiveManualTask() {
  const tasks = await listTasks();
  return tasks.some((task) => task.type === "manual" && ["pending", "running"].includes(task.status));
}

async function moveTask(task, from, to, patch = {}) {
  const next = { ...task, ...patch, status: basename(to), updatedAt: new Date().toISOString() };
  const fromPath = taskPath(from, task.id);
  const toPath = taskPath(to, task.id);
  await writeJson(fromPath, next);
  await rename(fromPath, toPath);
  return next;
}

function normalizeMathBlock(value) {
  const textValue = value.trim();
  if (!textValue) return "";
  if (textValue.startsWith("\\[") || textValue.startsWith("\\(")) return textValue;
  return `\\[${textValue}\\]`;
}

async function addNoteTask(task) {
  const contentPath = join(root, "content.json");
  const content = await readJson(contentPath);
  const note = task.note;

  if (!note?.title || !note?.category) {
    throw new Error("Note tasks require title and category");
  }

  const nextNote = {
    title: note.title,
    category: note.category,
    description: note.description || "",
    body: String(note.body || "")
      .split(/\n\s*\n/)
      .map((part) => part.trim())
      .filter(Boolean)
  };

  const math = String(note.math || "")
    .split(/\n+/)
    .map(normalizeMathBlock)
    .filter(Boolean);
  if (math.length) nextNote.math = math;
  if (note.formula) nextNote.formula = note.formula;
  if (note.url) nextNote.url = note.url;

  content.notes = [nextNote, ...(content.notes || [])];
  await writeJson(contentPath, content);
  await appendLog(task.id, `Added note "${note.title}" to content.json`);
}

async function validateAndPublish(task) {
  const before = await run("git", ["status", "--short"]);
  const beforeChanges = before.stdout.trim().split("\n").filter(Boolean);
  const allowedBefore = task.type === "add-note" ? ["content.json"] : [];
  const unrelated = beforeChanges.filter((line) => {
    const path = line.slice(3);
    return !allowedBefore.includes(path);
  });
  if (unrelated.length) {
    throw new Error(`Worktree has unrelated changes:\n${unrelated.join("\n")}`);
  }

  const checks = [
    ["node", ["-e", "JSON.parse(require('fs').readFileSync('content.json','utf8')); console.log('content ok')"]],
    ["node", ["--check", "script.js"]]
  ];

  for (const [command, args] of checks) {
    const result = await run(command, args);
    await appendLog(task.id, `$ ${command} ${args.join(" ")}\n${result.stdout}${result.stderr}`.trim());
    if (result.code !== 0) {
      throw new Error(`Check failed: ${command} ${args.join(" ")}`);
    }
  }

  const status = await run("git", ["status", "--short"]);
  const changed = status.stdout.trim().split("\n").filter(Boolean);
  if (!changed.length) {
    await appendLog(task.id, "No file changes to commit");
    return { commit: "", pushed: false };
  }

  await run("git", ["add", "content.json"]);
  const message = task.note?.title ? `Add note: ${task.note.title}` : `Workbench task: ${task.prompt.slice(0, 48)}`;
  const commit = await run("git", ["commit", "-m", message]);
  await appendLog(task.id, `$ git commit -m "${message}"\n${commit.stdout}${commit.stderr}`.trim());
  if (commit.code !== 0) throw new Error("git commit failed");

  const hash = (await run("git", ["log", "--oneline", "-1"])).stdout.trim();
  const push = await run("git", ["push", "origin", "main"]);
  await appendLog(task.id, `$ git push origin main\n${push.stdout}${push.stderr}`.trim());
  if (push.code !== 0) throw new Error("git push failed");

  return { commit: hash, pushed: true };
}

async function processOneTask() {
  const pending = await readdir(taskDirs.pending).catch(() => []);
  const name = pending.filter((item) => item.endsWith(".json")).sort()[0];
  if (!name) return null;

  const task = await readJson(join(taskDirs.pending, name));
  let running = await moveTask(task, taskDirs.pending, taskDirs.running);
  await appendLog(task.id, `Started task: ${task.prompt || task.type}`);

  try {
    if (task.type === "add-note") {
      await addNoteTask(running);
      const result = await validateAndPublish(running);
      running = await moveTask(running, taskDirs.running, taskDirs.done, { result });
      await appendLog(task.id, "Task completed");
      return running;
    }

    await appendLog(task.id, "Manual Codex task queued. Copy this prompt into Codex if needed.");
    running = await moveTask(running, taskDirs.running, taskDirs.done, {
      result: { manual: true, prompt: task.prompt }
    });
    return running;
  } catch (error) {
    await appendLog(task.id, `Task failed: ${error.message}`);
    return moveTask(running, taskDirs.running, taskDirs.failed, { error: error.message });
  }
}

async function createTask(payload) {
  if ((payload.type || "manual") === "manual" && await hasActiveManualTask()) {
    throw new Error("A Codex task is already pending or running. Wait for it to finish before sending another prompt.");
  }

  const now = new Date().toISOString();
  const task = {
    id: taskId(),
    type: payload.type || "manual",
    mode: payload.mode === "plan" ? "plan" : "default",
    prompt: payload.prompt || "",
    note: payload.note || null,
    status: "pending",
    createdAt: now,
    updatedAt: now
  };
  await writeJson(taskPath(taskDirs.pending, task.id), task);
  await appendLog(task.id, "Task created");
  return task;
}

async function withTaskCreationLock(callback) {
  const previous = taskCreationLock;
  let release;
  taskCreationLock = new Promise((resolveLock) => {
    release = resolveLock;
  });
  await previous;
  try {
    return await callback();
  } finally {
    release();
  }
}

async function serveFile(urlPath, res) {
  const requestPath = urlPath === "/" ? "/index.html" : urlPath.replace(/^\/workbench\/?/, "/");
  const filePath = normalize(join(workbenchRoot, requestPath));
  if (!filePath.startsWith(workbenchRoot)) {
    text(res, 403, "Forbidden");
    return;
  }
  const stats = await stat(filePath).catch(() => null);
  if (!stats?.isFile()) {
    text(res, 404, "Not found");
    return;
  }
  const body = await readFile(filePath);
  const type = mimeTypes[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type, "Content-Length": body.length });
  res.end(body);
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${host}:${port}`);

  try {
    if (url.pathname === "/admin" || url.pathname === "/workbench") {
      if (!isAuthorized(req, url)) {
        text(res, 401, "Unauthorized. Start the workbench server and open the URL it prints.");
        return;
      }
      await serveFile("/index.html", res);
      return;
    }

    if (url.pathname.startsWith("/workbench/")) {
      if (!isAuthorized(req, url)) {
        text(res, 401, "Unauthorized");
        return;
      }
      await serveFile(url.pathname, res);
      return;
    }

    if (url.pathname.startsWith("/api/") && !isAuthorized(req, url)) {
      json(res, 401, { error: "Unauthorized" });
      return;
    }

    if (url.pathname === "/api/sync") {
      json(res, 200, {
        siteUrl: `http://localhost:${sitePort}/notes.html`,
        workbenchUrl: `http://localhost:${port}/workbench`,
        git: await gitStatus(),
        tasks: await listTasks()
      });
      return;
    }

    if (url.pathname === "/api/tasks" && req.method === "GET") {
      json(res, 200, { tasks: await listTasks() });
      return;
    }

    if (url.pathname === "/api/tasks" && req.method === "POST") {
      const payload = JSON.parse(await readBody(req) || "{}");
      const task = await withTaskCreationLock(() => createTask(payload));
      const processed = task.type === "add-note" ? await processOneTask() : null;
      json(res, 201, { task: processed || task });
      return;
    }

    if (url.pathname === "/api/process" && req.method === "POST") {
      const task = await processOneTask();
      json(res, 200, { task });
      return;
    }

    const logMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/log$/);
    if (logMatch) {
      const path = join(logDir, `${logMatch[1]}.log`);
      text(res, 200, existsSync(path) ? await readFile(path, "utf8") : "");
      return;
    }

    await serveFile(url.pathname, res);
  } catch (error) {
    const status = error.message.includes("pending or running") ? 409 : 500;
    json(res, status, { error: error.message });
  }
}

await ensureStore();
createServer(handle).listen(port, host, () => {
  console.log(`Ruka workbench: http://${host}:${port}/workbench?token=${encodeURIComponent(token)}`);
  if (tokenWasGenerated) {
    console.log("RUKA_WORKBENCH_TOKEN was not set; generated a temporary token for this server run.");
  }
});
