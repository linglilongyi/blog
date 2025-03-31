import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_LANGUAGE, SITE_TAB, SITE_TITLE } from "@config";
import { getCollection } from "astro:content";
import { marked } from "marked";

export async function GET(context: any) {
  const all_blog_posts = await getCollection("posts");
  const posts = all_blog_posts.filter((post) => !post.data.draft);
  const sortedPosts = posts.sort((a: any, b: any) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime());

  function replacePath(content: string, siteUrl: string): string {
    return content.replace(/(src|img|r|l)="([^"]+)"/g, (match, attr, src) => {
      if (!src.startsWith("http") && !src.startsWith("//") && !src.startsWith("data:")) {
        return `${attr}="${new URL(src, siteUrl).toString()}"`;
      }
      return match;
    });
  }

  const items = await Promise.all(sortedPosts.map(async (posts: any) => {
    const { data: { title, description, publishDate }, body, slug } = posts;

    const content = body
      ? replacePath(await marked(body), context.site)
      : "No content available.";

    const postURL = new URL(`/posts/${slug}/`, context.site);

    return {
      title,
      description,
      link: postURL.toString(),
      guid: postURL.toString(),
      content: content,
      customData: `
        <dc:creator><![CDATA[${SITE_TAB}]]></dc:creator>
        <pubDate>${new Date(publishDate).toUTCString()}</pubDate>
      `,
    };
  }));

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    stylesheet: '/rss.xsl',
    items,
    customData: `
      <language>${SITE_LANGUAGE}</language>
    `
  });
}
