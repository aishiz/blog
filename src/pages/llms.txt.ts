import { getCollection } from 'astro:content';
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
		`Автор: ${AUTHOR_NAME}. Язык контента: русский.`,
		'',
		'## Статьи',
		'',
		...posts.map((p) => `- [${p.data.title}](${new URL(`/blog/${p.id}/`, context.site)}): ${p.data.description}`),
		'',
		'## Другое',
		'',
		`- [Обо мне](${new URL('/about', context.site)})`,
		`- [RSS](${new URL('/rss.xml', context.site)})`,
	];

	return new Response(lines.join('\n') + '\n', {
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
	});
}
