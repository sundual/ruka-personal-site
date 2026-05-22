# Ruka Personal Site

Static personal website draft for `ruka.us.ci`.

## Local Preview

For the plain static site:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## Integrated Codex Dock

For the site with the right-side Codex dock and local task API, run:

```sh
node tools/workbench-server.mjs
```

Then open the tokenized URL it prints:

```text
http://127.0.0.1:8787/?token=...
```

In another terminal, run the Codex task runner so queued prompts are executed:

```sh
node tools/workbench-runner.mjs
```

Use Sync to refresh git/task status. Save the local token once, switch between
Default and Plan mode, and send prompts from the dock.

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
