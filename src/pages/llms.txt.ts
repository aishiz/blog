import { getCollection } from 'astro:content';
import { CATEGORIES } from '../data/categories';
import { SITE_TITLE, SITE_DESCRIPTION, AUTHOR_NAME } from '../consts';

export async function GET(context) {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);

	const lines = [
		`# ${SITE_TITLE}`,
		'',
		`> ${SITE_DESCRIPTION}`,
		'',
		`Автор: ${AUTHOR_NAME} (руководитель AI Factory). Язык контента: русский. Telegram: https://t.me/ai_shizz`,
		'',
	];

	for (const cat of CATEGORIES) {
		const catPosts = posts.filter((p) => p.data.category === cat.key);
		if (catPosts.length === 0) continue;
		lines.push(`## ${cat.title} (${new URL(`/blog/category/${cat.slug}/`, context.site)})`);
		lines.push('');
		lines.push(`> ${cat.blurb}`);
		lines.push('');
		for (const p of catPosts) {
			lines.push(`- [${p.data.title}](${new URL(`/blog/${p.id}/`, context.site)}): ${p.data.description}`);
		}
		lines.push('');
	}

	const uncategorized = posts.filter((p) => !p.data.category);
	if (uncategorized.length > 0) {
		lines.push('## Другие статьи', '');
		for (const p of uncategorized) {
			lines.push(`- [${p.data.title}](${new URL(`/blog/${p.id}/`, context.site)}): ${p.data.description}`);
		}
		lines.push('');
	}

	lines.push(
		'## Служебные разделы',
		'',
		`- [Все статьи](${new URL('/blog/', context.site)})`,
		`- [Обо мне](${new URL('/about/', context.site)})`,
		`- [RSS](${new URL('/rss.xml', context.site)})`,
		`- [Sitemap](${new URL('/sitemap-index.xml', context.site)})`,
	);

	return new Response(lines.join('\n') + '\n', {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
}
