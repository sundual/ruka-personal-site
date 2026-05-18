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

The local workbench shows the static site preview with a single Codex session
box beside it. It is localhost-only, token-protected, and its UI files live
under `tools/`, so they are not part of the public static site.

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

Use Sync to refresh git/task status and the preview. Send prompts from the
Codex session box; prompts are queued one at a time so the session stays
serial and coherent. Toggle Plan mode when the prompt should produce a plan
instead of editing files.

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
