# Ruka Personal Site

Static personal website for `ruka.us.ci`.

The project intentionally stays small: plain HTML, CSS, JavaScript, and JSON
content. There is no framework, package manager, build step, task receiver, or
local API.

## File Map

Public site files:

- `index.html`: homepage structure.
- `math.html`: math note reader.
- `physics.html`: physics note reader.
- `plan.html`: rendered long-form learning plan page.
- `learning-plan.html`: legacy redirect to `plan.html`.
- `styles.css`: visual design for all pages.
- `script.js`: static rendering behavior for JSON and Markdown content.
- `content.json`: editable profile, links, notes, projects, about, contact, and update timestamp.
- `learning-plan.md`: source Markdown for the plan page.

Maintenance files:

- `README.md`: project overview and normal workflow.
- `AGENTS.md`: rules for Codex or other coding agents working in this repo.
- `PLAN.md`: longer product/content direction for the site.
- `.gitignore` and `.gitattributes`: repository housekeeping.

## Local Preview

For the plain static site:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

Refresh the browser after editing files.

## Edit Guide

- Profile text, links, notes, projects, about, contact, and the floating update timestamp: edit `content.json`.
- Homepage layout: edit `index.html`.
- Math/physics/plan page shells: edit `math.html`, `physics.html`, or `plan.html`.
- Long learning plan body: edit `learning-plan.md`.
- Visual style: edit `styles.css`.
- Rendering behavior: edit `script.js`.
- Longer site direction: edit `PLAN.md`.

There is no build step. This is intentional so Cloudflare Pages can deploy the files directly.

## Update Timestamp

The floating `Updated` widget reads `profile.lastUpdated` from `content.json`.
When publishing a meaningful site change, update that timestamp in ISO 8601
format, for example:

```json
"lastUpdated": "2026-05-22T12:54:43+08:00"
```

## Deploy

Cloudflare Pages deploys the `main` branch automatically after pushing:

```sh
git status
git add -A
git commit -m "Describe change"
git push origin main
```

## Cloudflare Pages Settings

- Build command: leave empty
- Build output directory: `/`
- Custom domain: `ruka.us.ci`
