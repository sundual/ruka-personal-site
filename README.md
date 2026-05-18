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

