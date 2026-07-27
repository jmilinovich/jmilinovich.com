import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function GET(context: APIContext) {
  const posts = await getCollection('writing', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  const site = context.site ?? new URL('https://mili.dev');

  const items = sorted
    .map((p) => {
      const url = new URL(`/writing/${p.id}/`, site).href;
      return `    <item>
      <title>${escape(p.data.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(p.data.date).toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>John Milinovich</title>
    <link>${site.href}</link>
    <description>Writing on AI, product craft, and building things</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
