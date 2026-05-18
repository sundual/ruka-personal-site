const fields = {
  category: document.querySelector("#category"),
  title: document.querySelector("#title"),
  description: document.querySelector("#description"),
  body: document.querySelector("#body"),
  math: document.querySelector("#math"),
  formula: document.querySelector("#formula")
};

const previewCard = document.querySelector("#preview-card");
const gitStatus = document.querySelector("#git-status");
const taskList = document.querySelector("#task-list");
const taskLog = document.querySelector("#task-log");
const codexPrompt = document.querySelector("#codex-prompt");
const urlToken = new URLSearchParams(window.location.search).get("token");
if (urlToken) {
  sessionStorage.setItem("rukaWorkbenchToken", urlToken);
  history.replaceState(null, "", window.location.pathname);
}
const authToken = sessionStorage.getItem("rukaWorkbenchToken") || "";

function noteFromForm() {
  return {
    category: fields.category.value,
    title: fields.title.value.trim(),
    description: fields.description.value.trim(),
    body: fields.body.value.trim(),
    math: fields.math.value.trim(),
    formula: fields.formula.value.trim()
  };
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function renderPreview() {
  const note = noteFromForm();
  previewCard.replaceChildren();

  if (!note.title && !note.body && !note.math) {
    previewCard.append(element("p", "填写左侧内容后点 Preview。", "muted"));
    return;
  }

  previewCard.append(element("h3", note.title || "Untitled"));
  if (note.description) previewCard.append(element("p", note.description, "muted"));

  note.body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((paragraph) => previewCard.append(element("p", paragraph)));

  note.math
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((line) => previewCard.append(element("code", line, "math-line")));

  if (note.formula) previewCard.append(element("code", note.formula));
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

function renderTasks(tasks) {
  taskList.replaceChildren();
  if (!tasks.length) {
    taskList.append(element("p", "No tasks yet.", "muted"));
    return;
  }

  tasks.slice(0, 12).forEach((task) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `task ${task.status}`;
    button.innerHTML = "";
    button.append(
      element("strong", `${task.status}: ${task.note?.title || task.prompt || task.type}`),
      element("span", `${task.id} · ${task.updatedAt || task.createdAt}`)
    );
    button.addEventListener("click", () => loadLog(task.id));
    taskList.append(button);
  });
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

async function publish() {
  const note = noteFromForm();
  if (!note.title || !note.description) {
    taskLog.textContent = "Title and description are required.";
    return;
  }

  renderPreview();
  taskLog.textContent = "Publishing...";

  const payload = {
    type: "add-note",
    prompt: `Add note: ${note.title}`,
    note
  };

  const result = await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  await sync();
  await loadLog(result.task.id);
}

async function queueCodexTask() {
  const prompt = codexPrompt.value.trim();
  if (!prompt) {
    taskLog.textContent = "Codex task prompt is required.";
    return;
  }

  taskLog.textContent = "Queueing Codex task...";
  const result = await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      type: "manual",
      prompt
    })
  });

  codexPrompt.value = "";
  await sync();
  await loadLog(result.task.id);
}

document.querySelector("#preview-button").addEventListener("click", renderPreview);
document.querySelector("#sync-button").addEventListener("click", () => {
  sync().catch((error) => {
    taskLog.textContent = error.message;
  });
});
document.querySelector("#publish-button").addEventListener("click", () => {
  publish().catch((error) => {
    taskLog.textContent = error.message;
  });
});
document.querySelector("#codex-button").addEventListener("click", () => {
  queueCodexTask().catch((error) => {
    taskLog.textContent = error.message;
  });
});

sync().catch((error) => {
  taskLog.textContent = error.message;
});
