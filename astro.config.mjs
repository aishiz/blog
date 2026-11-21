// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

import react from '@astrojs/react';

// ponytail: даты статей парсим регэкспом из фронтматтера, чтобы дать sitemap честный lastmod
// не только для статей, но и для главной, /blog/ и каждой рубрики.
const CATEGORY_SLUG = /** @type {Record<string, string>} */ ({
    'фундамент': 'fundament',
    'тулы': 'tools',
    'модели': 'models',
    'хайп': 'hype',
});

const blogDir = 'src/content/blog';
const lastmodByPath = /** @type {Record<string, string>} */ ({});
let latestAll = 0;
const latestByCat = /** @type {Record<string, number>} */ ({});

for (const file of fs.readdirSync(blogDir)) {
    if (!file.endsWith('.mdx')) continue;
    const fm = fs.readFileSync(path.join(blogDir, file), 'utf8').slice(0, 1500);
    const pub = fm.match(/pubDate:\s*['"]?([^'"\n]+)/)?.[1];
    const upd = fm.match(/updatedDate:\s*['"]?([^'"\n]+)/)?.[1];
    const cat = fm.match(/category:\s*['"]?([^'"\n]+)/)?.[1]?.trim();
    const d = new Date((upd || pub || '').trim());
    if (Number.isNaN(d.getTime())) continue;
    const iso = d.toISOString();
    const ts = d.getTime();
    lastmodByPath[`/blog/${file.replace(/\.mdx$/, '')}/`] = iso;
    if (ts > latestAll) latestAll = ts;
    if (cat && CATEGORY_SLUG[cat] && ts > (latestByCat[cat] || 0)) {
        latestByCat[cat] = ts;
    }
}

if (latestAll > 0) {
    const allIso = new Date(latestAll).toISOString();
    lastmodByPath['/'] = allIso;
    lastmodByPath['/blog/'] = allIso;
}
for (const [cat, ts] of Object.entries(latestByCat)) {
    lastmodByPath[`/blog/category/${CATEGORY_SLUG[cat]}/`] = new Date(ts).toISOString();
}

// https://astro.build/config
export default defineConfig({
    site: 'https://ai-shiz.ru',
    // pnpm-симлинки заставляют Vite поднимать два инстанса React в dev → "Invalid hook call".
    // dedupe форсит единственный инстанс react/react-dom при резолве.
    vite: {
        resolve: {
            dedupe: ['react', 'react-dom'],
        },
    },
    integrations: [
        mdx(),
        sitemap({
            filter: (page) => !page.endsWith('/404.html'),
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
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
    },
});
