# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal blog (Russian-language) about LLMs, AI agents, ML inference and quantization. Astro 5 + React 19, statically generated.

## Commands

```bash
npm run dev      # dev server at http://localhost:4321
npm run build    # static build to ./dist/
npm run preview  # serve the production build locally
```

No test suite, no linter configured. Both `package-lock.json` and `pnpm-lock.yaml` are committed; `.npmrc` + `package.json#pnpm.onlyBuiltDependencies` target pnpm, but npm works too. There is no single-test command because there are no tests.

## Architecture

**Content is the app.** Each post is one `.mdx` file in `src/content/blog/`. The `blog` collection (`src/content.config.ts`) loads them via glob and validates frontmatter with a zod schema: `title`, `description`, `pubDate` (required), `updatedDate?`, `heroImage?` (an `astro:assets` image, path relative to the mdx file e.g. `../../assets/...`). Adding a post = adding an `.mdx` file; routes, RSS, sitemap, prev/next and reading time are all derived.

**Two kinds of article components** in `src/components/article/`:
- `.astro` (Callout, QuantCard, MemoryBar, StepList) — static, server-rendered, decorative.
- `.tsx` (everything else, ~40 of them) — interactive React, **one-off per article**. Each MDX file `import`s only the components it uses and hydrates them with a `client:` directive — almost always `client:visible` (lazy), occasionally `client:load` for above-the-fold banners. These are bespoke visualizations, not a reusable library; don't try to generalize them.

**Routing / derived data** (`src/pages/blog/[...slug].astro`): `getStaticPaths` sorts posts by `pubDate` desc, and prev/next are just neighbors in that array. Reading time = `words/200` rounded, rendered as Russian `"N мин чтения"`.

**Theming is CSS-variable-driven, no flash.** The inline script in `src/components/BaseHead.astro` runs before paint, reads `localStorage['theme-pref']` (`light` | `dark` | `system`), and sets `data-theme` + `data-theme-pref` on `<html>`. `ThemeToggle.astro` cycles the preference. **Every color lives as a `--var` in `src/styles/global.css`**, defined twice: under `:root,[data-theme="dark"]` and `[data-theme="light"]`. When adding anything colored, use the existing vars (or add the pair to both themes) — never hardcode a hex, or it breaks one theme.

**SEO is generated, not hand-written per page.** `BaseHead.astro` emits canonical/OG/Twitter/RSS/sitemap tags; `BlogPost.astro` injects JSON-LD (`BlogPosting`, `BreadcrumbList`) and `index.astro`/`about.astro` add `WebSite`/`Person`. Site-wide strings (title, description, author) come from `src/consts.ts`. `astro.config.mjs` has `site: 'https://example.com'` as a placeholder — canonical URLs and `Astro.site` depend on it.

**UI behaviors that surprise:** the image lightbox is an inline script inside `src/layouts/BlogPost.astro` (not a component); search (`SearchBar.tsx`) lives only on `src/pages/blog/index.astro`. Code blocks use Shiki dual themes (`github-light-default` / `github-dark-default`, configured in `astro.config.mjs`).

Content and UI copy are in Russian — match that when editing user-facing text.
