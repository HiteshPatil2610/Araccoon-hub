# Articles

Each `.md` file in this folder is one article on the site, at `/articles/<file-name>`.
There is no CMS: write the file, commit it, deploy.

## Start a new article

Copy `_template.md` (files starting with `_` are ignored) to a new name such as
`best-desk-gadgets.md`. The file name becomes the URL, so use lowercase words and dashes.

```markdown
---
title: The 5 desk gadgets I actually use
description: One or two sentences for search results and link previews (up to 200 characters).
date: 2026-11-03
updated: 2026-11-10          # optional
image: /art/raccoon-hero.webp   # optional cover: a site path or https URL
imageAlt: The raccoon mascot at a desk   # required when image is set
products:                     # optional: product ids, shown as cards under the article
  - 3f1c2a9e-1111-4b6a-9c3d-123456789abc
draft: true                   # optional: drafts only show in `npm run dev`
---

Your article in Markdown. Use `##` for section headings.
```

## Rules the build checks

- `title`, `description` and `date` are required.
- Use `##` and below for headings; the title is the page's only `#` heading.
- Images need alt text: `![what the picture shows](/art/raccoon-side.webp "optional caption")`.
- **No direct Amazon links.** Put product ids under `products:` instead, so every link
  goes through the tracked `/r/` redirect with the right Associates tag. Copy an id from
  the owner hub: Products → edit a product → "Copy id" near the bottom.
- Raw HTML is shown as text, not rendered.
- Products that are missing, drafts or archived are simply not shown.

If something is wrong, `npm run dev`, `npm run build` and `npm test` stop with the file
name and what to fix.

## Preview

`npm run dev`, then open http://localhost:5173/articles. Drafts are included locally and
marked "Draft"; they are never published.
