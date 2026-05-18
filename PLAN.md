# Personal Website Plan

## Goal

Create a small personal website for `ruka.us.ci` that is easy to revise with Codex and easy to preview locally by refreshing the browser.

The first version should be deliberately simple: static files, no build step, no database, no account system, and no framework lock-in. This keeps edits transparent and makes Cloudflare Pages deployment straightforward.

## Site Identity

- Working name: Ruka
- Domain: `ruka.us.ci`
- Primary purpose: personal homepage, light portfolio, writing index, and contact point
- Tone: quiet, direct, personal, slightly technical
- Audience: friends, classmates, collaborators, future readers, and anyone who receives the link

## Information Architecture

The first page is a single-page site with anchors:

1. Home
   - Name
   - Short self-description
   - Current status or focus
   - Primary links

2. Notes
   - Small list of things worth writing about
   - Can later become a blog or notes index

3. Projects
   - Small experiments, school work, tools, websites, or programming projects
   - Each item should include a title, short description, and optional link

4. About
   - More personal context
   - Interests
   - What kind of things may appear on the site

5. Contact
   - Email or preferred contact method
   - GitHub link
   - Optional social links

## Content Model

Editable content lives in `content.json`.

Recommended fields:

- `profile.name`
- `profile.domain`
- `profile.tagline`
- `profile.status`
- `profile.location`
- `profile.links`
- `notes`
- `projects`
- `about`
- `contact`

This split lets Codex revise wording and lists without changing the HTML structure. It also keeps future migration easy if the site later moves to Astro, Eleventy, or another static site generator.

## Visual Direction

- Clean personal homepage, not a marketing landing page
- Dense enough to be useful, but not a dashboard
- Light background with strong readable text
- restrained color accents
- Clear navigation and strong mobile layout
- No oversized hero card
- No decorative blobs or generic stock imagery

## Revision Workflow

For small content edits:

1. Edit `content.json`.
2. Refresh the browser.

For visual/layout edits:

1. Edit `styles.css` or `index.html`.
2. Refresh the browser.

For behavior edits:

1. Edit `script.js`.
2. Refresh the browser.

Codex should usually prefer this order:

1. Update `content.json` when changing text, links, notes, or projects.
2. Update `styles.css` when changing appearance.
3. Update `index.html` only when changing structure.
4. Update `script.js` only when changing rendering behavior.

## Deployment Plan

Recommended deployment target: Cloudflare Pages.

1. Create a GitHub repository, for example `ruka-personal-site`.
2. Push this folder to that repository.
3. In Cloudflare, create a Pages project connected to the repository.
4. Build settings:
   - Build command: leave empty
   - Build output directory: `/`
5. Add the custom domain `ruka.us.ci` in the Pages project.
6. Optionally add `www.ruka.us.ci` and redirect it to the preferred domain.

## Future Additions

Good next additions, in order:

1. Replace placeholder contact links with real links.
2. Add a `notes/` folder with standalone HTML or Markdown-generated pages.
3. Add Open Graph metadata and a small preview image.
4. Add analytics only if there is a clear reason.
5. Add an RSS feed if notes become frequent.
6. Move to a static site generator only when manual editing becomes annoying.

## Privacy Checklist

Before publishing:

- Do not include private phone numbers, addresses, IDs, passwords, or tokens.
- Do not include school documents or private files unless intentionally public.
- Use a contact email that is acceptable to publish.
- Confirm all linked accounts are intended to be public.
- Review Git history before the first public push.

