const gitStatus = document.querySelector("#git-status");
const taskList = document.querySelector("#task-list");
const taskLog = document.querySelector("#task-log");
const codexPrompt = document.querySelector("#codex-prompt");
const promptForm = document.querySelector("#prompt-form");
const codexButton = document.querySelector("#codex-button");
const siteFrame = document.querySelector("#site-frame");
const modeButtons = Array.from(document.querySelectorAll(".mode"));

const urlToken = new URLSearchParams(window.location.search).get("token");
if (urlToken) {
  sessionStorage.setItem("rukaWorkbenchToken", urlToken);
  history.replaceState(null, "", window.location.pathname);
}
const authToken = sessionStorage.getItem("rukaWorkbenchToken") || "";
let currentMode = sessionStorage.getItem("rukaWorkbenchMode") || "default";
let lastTaskFingerprint = "";

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  const type = response.headers.get("content-type") || "";
  const payload = type.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(payload.error || payload || response.statusText);
  }
  return payload;
}

function setMode(mode) {
  currentMode = mode;
  sessionStorage.setItem("rukaWorkbenchMode", mode);
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

function activeTask(tasks) {
  return tasks.find((task) => task.status === "running" || task.status === "pending");
}

function renderTasks(tasks) {
  const fingerprint = JSON.stringify(tasks.map((task) => [task.id, task.status, task.updatedAt]));
  taskList.replaceChildren();

  if (!tasks.length) {
    taskList.append(element("p", "No Codex session tasks yet.", "muted"));
  } else {
    tasks.slice(0, 16).forEach((task) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `task ${task.status}`;
      button.append(
        element("strong", `${task.status}: ${task.mode === "plan" ? "Plan mode" : "Default"}`),
        element("span", task.prompt || task.type),
        element("span", `${task.id} · ${task.updatedAt || task.createdAt}`)
      );
      button.addEventListener("click", () => loadLog(task.id));
      taskList.append(button);
    });
  }

  const active = activeTask(tasks);
  codexButton.disabled = Boolean(active);
  codexPrompt.disabled = Boolean(active);
  codexButton.textContent = active ? "Codex is busy" : "Send";

  if (fingerprint !== lastTaskFingerprint) {
    lastTaskFingerprint = fingerprint;
    refreshPreview();
  }
}

function refreshPreview() {
  const url = new URL(siteFrame.src);
  url.searchParams.set("_", Date.now().toString());
  siteFrame.src = url.toString();
}

async function sync() {
  const data = await api("/api/sync");
  gitStatus.textContent = data.git.status || "Clean";
  renderTasks(data.tasks || []);
}

async function loadLog(id) {
  const response = await fetch(`/api/tasks/${id}/log`, {
    cache: "no-store",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
  });
  taskLog.textContent = await response.text();
}

async function queueCodexTask() {
  const prompt = codexPrompt.value.trim();
  if (!prompt) {
    taskLog.textContent = "Prompt is required.";
    return;
  }

  taskLog.textContent = "Sending task to Codex queue...";
  const result = await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      type: "manual",
      mode: currentMode,
      prompt
    })
  });

  codexPrompt.value = "";
  await sync();
  await loadLog(result.task.id);
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

document.querySelector("#sync-button").addEventListener("click", () => {
  sync().catch((error) => {
    taskLog.textContent = error.message;
  });
});

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  queueCodexTask().catch((error) => {
    taskLog.textContent = error.message;
  });
});

setMode(currentMode);
sync().catch((error) => {
  taskLog.textContent = error.message;
});
setInterval(() => {
  sync().catch(() => {});
}, 3500);
