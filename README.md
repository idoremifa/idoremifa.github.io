# idoremifa.github.io

Source for [idoremifa.github.io](https://idoremifa.github.io) — a personal tech blog by Ido. Notes on software, learning, and what I'm building.

Built with [Astro](https://astro.build/) on top of the [astro-paper](https://github.com/satnaing/astro-paper) theme (MIT). Deployed to GitHub Pages on push to `main`.

## Local development

```bash
pnpm install   # one-time
pnpm dev       # http://localhost:4321
pnpm build     # production build to dist/
```

## Writing a post

Add a markdown file under `src/data/blog/`. Copy [`src/data/blog/welcome.md`](src/data/blog/welcome.md) as a starting template — it documents every supported frontmatter field. Required fields: `title`, `pubDatetime`, `description`. The full schema lives in [`src/content.config.ts`](src/content.config.ts).
