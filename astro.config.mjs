// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';

import react from '@astrojs/react';

// ponytail: даты статей парсим регэкспом из фронтматтера, чтобы дать sitemap честный lastmod
// без лишней зависимости (gray-matter). Если статей станет сотни — взять content collection API.
const blogDir = 'src/content/blog';
const lastmodByPath = /** @type {Record<string, string>} */ ({});
for (const file of fs.readdirSync(blogDir)) {
    if (!file.endsWith('.mdx')) continue;
    const fm = fs.readFileSync(path.join(blogDir, file), 'utf8').slice(0, 1200);
    const pub = fm.match(/pubDate:\s*['"]?([^'"\n]+)/)?.[1];
    const upd = fm.match(/updatedDate:\s*['"]?([^'"\n]+)/)?.[1];
    const d = new Date((upd || pub || '').trim());
    if (Number.isNaN(d.getTime())) continue;
    lastmodByPath[`/blog/${file.replace(/\.mdx$/, '')}/`] = d.toISOString();
}

// https://astro.build/config
export default defineConfig({
    site: 'https://ai-shiz.ru',
    integrations: [
        mdx(),
        sitemap({
            serialize(item) {
                const pathname = new URL(item.url).pathname;
                if (lastmodByPath[pathname]) item.lastmod = lastmodByPath[pathname];
                return item;
            },
        }),
        react(),
    ],
    markdown: {
        shikiConfig: {
            themes: {
                light: 'github-light-default',
                dark: 'github-dark-default',
            },
        },
    },
});
