// source:https://github.com/gsong/personal-site/blob/main/src/data/feeds/index.ts
import type { APIContext } from "astro";
import type { Author, FeedOptions } from "feed";
import { USER_NAME, SITE_DESCRIPTION, SITE_LANGUAGE,  SITE_TITLE } from "@config";
import { getCollection } from "astro:content";
import { Feed } from "feed";

import { createUrl, mdxToHtml } from "./utils";

interface SiteAuthor extends Author {
  link: string;
}


export async function generateFeed(context: APIContext): Promise<Feed> {
  // biome-ignore lint/style/noNonNullAssertion: we know
  const site = context.site!.toString();
  const author: SiteAuthor = {
    name: USER_NAME,
    email: "linglilongyi@gmail.com",
    link: site,
  };
  const feed = createFeedInstance(site, author);

  await addArticlesToFeed(feed, site, author);

  return feed;
}

function createFeedInstance(site: string, author: SiteAuthor): Feed {
  const feedOptions: FeedOptions = {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    id: site,
    link: site,
    language: SITE_LANGUAGE,
    favicon: createUrl("/favicon.ico", site) as string,
    copyright: `Copyright ${new Date().getFullYear()} 绫里龙一`,
    feedLinks: {
      atom: createUrl("/rss.xml", site) as string,
    },
    author,
  };

  return new Feed(feedOptions);
}

async function addArticlesToFeed(
  feed: Feed,
  site: string,
  author: SiteAuthor,
): Promise<void> {
    const all_blog_posts = await getCollection("posts");
    const publishPosts = all_blog_posts.filter((post) => !post.data.draft);
    const sortedPosts = publishPosts.sort((a: any, b: any) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime());
    const posts = sortedPosts.slice(0, 10);

  for (const post of posts) {
    
    const link = createUrl(`/posts/${post.id}`.replace(/\.md$/, '/'), site) as string;

    feed.addItem({
      title: post.data.title,
      guid: link,
      link,
      published: post.data.publishDate,
      date: post.data.updatedDate || post.data.publishDate,
      author: [author],
      description: await mdxToHtml(post.data.description, site),
      content: await mdxToHtml(post.body || "", site),
    });
  }
}