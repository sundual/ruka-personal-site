# Ruka Personal Site

Static personal website draft for `ruka.us.ci`.

## Local Preview

From this folder:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

After edits, refresh the browser.

## Local Workbench

The local workbench is a browser front end for adding notes and publishing them.
It is localhost-only, token-protected, and its UI files live under `tools/`, so
they are not part of the public static site.

In one terminal, run the static preview:

```sh
python3 -m http.server 8000
```

In another terminal, run the workbench:

```sh
node tools/workbench-server.mjs
```

Optionally, run the Codex task runner in a third terminal. This consumes tasks
queued from the "Send to Codex" box:

```sh
node tools/workbench-runner.mjs
```

Then open:

```text
the tokenized URL printed by tools/workbench-server.mjs
```

Use Sync to refresh git/task status. Use Publish to add a note to `content.json`,
run checks, commit, and push to `origin/main`. Use "Send to Codex" for broader
tasks that should be handled by the local Codex CLI through the task queue.

For a stable token, start the server with:

```sh
RUKA_WORKBENCH_TOKEN="choose-a-local-secret" node tools/workbench-server.mjs
```

## Edit Guide

- Text, links, notes, projects: edit `content.json`
- Layout: edit `index.html`
- Visual style: edit `styles.css`
- Rendering behavior: edit `script.js`
- Overall plan: edit `PLAN.md`

There is no build step. This is intentional so Cloudflare Pages can deploy the files directly.

## Cloudflare Pages Settings

- Build command: leave empty
- Build output directory: `/`
- Custom domain: `ruka.us.ci`
