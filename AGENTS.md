# Ruka Site Maintenance

## Project

This is a static personal site for `ruka.us.ci`.

- No framework
- No build step
- No package manager required
- Cloudflare Pages deploys the `main` branch automatically

## Edit Rules

- Content, links, notes, projects, about text, and contact text: edit `content.json`.
- Layout structure: edit `index.html`.
- Visual design: edit `styles.css`.
- Rendering behavior: edit `script.js`.
- Keep the site static unless the user explicitly asks for a build system.
- Do not add secrets, private documents, phone numbers, addresses, IDs, passwords, or tokens.

## Local Preview

For the plain static site:

```sh
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173
```

## Deploy

The Git remote is:

```text
origin = git@github.com:sundual/ruka-personal-site.git
```

Normal update flow:

```sh
git status
git add -A
git commit -m "Describe change"
git push
```

Cloudflare Pages deploys after `main` is pushed.

## Cloudflare Pages Settings

- Project: `ruka-personal-site`
- Production branch: `main`
- Build command: leave empty
- Build output directory: `/`
- Custom domain: `ruka.us.ci`

## Domain Note

The intended domain in project files is `ruka.us.ci`.

If the user writes `ruak.us.ci`, confirm whether that is a typo before changing content or documentation.
