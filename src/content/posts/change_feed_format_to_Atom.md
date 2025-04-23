---
title: 将博客订阅格式改为Atom
description: 将订阅格式改为了Atom，希望能够增强订阅体验
publishDate: 2025-04-20T10:50:00
createTime: 2025-04-21
categories:
  - 一技之长
tags:
  - 博客
draft: false
hidden: false
updatedDate: 2025-04-23
---
> 20250423更新: feed 增加 image 的 metadata，并且同时生成 Atom 和 RSS 让 folo 可以抓取到网站icon。

其实博客本身使用的主题 Frosti 自带也有 RSS 订阅，只是自己一直还想折腾。因为之前看到[雨帆的订阅页面](https://yufan.me/feed)很好看，一直很馋。直接把他的 xsl 引入后发现他有通过分类进行次级订阅，但我的博客还没有像他一样深度实现分类，于是产生了冲突。再后来发现 folo 上的订阅无法获取更新。总之存在许多问题，于是便空出时间稍微整理一下。

## rss vs Atom
稍微了解了一下，发现主流的订阅格式有RSS和Atom。很多语境中RSS已经等同于订阅本身了，但在阅读了部分材料后，我决定要使用Atom。一部分是因为它有着更标准的格式，另一部分就是因为他恰到好处的复杂让我觉得实现起来有成就感。

20250423更新：很可惜的是，folo 对 Atom 格式的支持似乎比较少，订阅头像只能通过 rss.channel.image 获取。支持 Atom logo 的 [issue](https://github.com/RSSNext/Folo/issues/1015)也被标记为 `Closed as not planned`, 所以只好同时生成 Atom 和 RSS 格式，并且在网页的页脚指向 Atom，folo 订阅继续指向 RSS。
## Atom in Astro
我的博客是用Astro搭建的，Astro官方就有在维护`@astrojs/rss`的插件，可以很方便地生成RSS。而至今都没有相关插件可以生成Atom格式订阅。而 George Song 的博客刚好有[相关实现](https://gsong.dev/articles/astro-feed-unified/)，复制粘贴的同时也向原作者询问了授权。

![George授权.avif](https://image.linglilongyi.com/2025/04/George授权.avif)

我之前用的rss已经在folo上认证了，本来想着要不直接弄个新的算了。但是翻看以前的文章，看到有四个人在看，「人是目的」。虽然软件工程里面有很多规范，但都应该是为了用户体验。命名规范是为了方便读者理解，方便开发者维护，但首先应该保证产品的可及性。虽然我的小破博客还称不上产品。

~~所以我们按照George的实现一步步来完成，首先来编辑`src/pages/rss.xml.ts`，编译后就会在网站根目录下生成rss.xml。~~
我们分别编辑`src/pages/atom.xml.ts`
```ts
// source: https://github.com/gsong/personal-site/blob/main/src/pages/atom.xml.ts
import type { APIContext } from "astro";

import { generateFeed } from "@/utils/feeds";

export async function GET(context: APIContext) {
  const feed = await generateFeed(context);
  return new Response(feed.atom1(), {
    headers: { "Content-Type": "application/atom+xml" },
  });
}
```

和 `src/pages/rss.xml.ts`
```ts
// source: https://github.com/gsong/personal-site/blob/main/src/pages/rss.xml.ts
import type { APIContext } from "astro";

import { generateFeed } from "@/utils/feeds";

export async function GET(context: APIContext) {
  const feed = await generateFeed(context);
  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/xml" },
  });
}
```

可以看到，这个文件非常的简洁，大部分的逻辑都被分离到引入的`generateFeed`模块。实际上，George在他的实现中是同时处理 RSS 和 Atom 的，所以将共用的功能分离了出来，为了避免问题以及之后的扩展性，我也基本上学（chao）过来了。之后在`src`下增加`utils/feeds`文件夹，并放入两个文件。

```ts
//utils.ts
// source:https://github.com/gsong/personal-site/blob/main/src/data/feeds/utils.ts
import type { Root as HastRoot, RootContent } from "hast";
import type { Root as MdastRoot } from "mdast";
import type { Plugin } from "unified";

import { Buffer } from "node:buffer";

import minifyHtml from "@minify-html/node";
import rehypeStringify from "rehype-stringify";
import remarkMarkers from "remark-flexible-markers";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

type UrlLike = URL | string;

export async function mdxToHtml(
  mdxContent: string,
  site: UrlLike,
): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkMarkers, { markerClassName: () => [] })
    .use(remarkRemoveToc)
    .use(remarkRemoveImports)
    .use(remarkRehype)
    .use(rehypeAbsoluteUrls, site)
    .use(rehypeStringify)
    .process(mdxContent);

  return minifyHtml
    .minify(Buffer.from(result.toString()), { keep_closing_tags: true })
    .toString();
}

export function createUrl(path: string, baseUrl: UrlLike): string | null {
  try {
    const fullUrl = new URL(path, baseUrl);
    return fullUrl.href;
  } catch (error) {
    console.error("Invalid path or base URL:", error);
    return null;
  }
}

// Remark plugins
const remarkRemoveImports: Plugin<[], MdastRoot> = () => {
  return (tree) => {
    tree.children = tree.children.filter((node) => node.type !== "mdxjsEsm");
    return tree;
  };
};

const remarkRemoveToc: Plugin<[], MdastRoot> = () => {
  return (tree: MdastRoot) => {
    tree.children = tree.children.filter((node) => {
      if (node.type === "heading" && node.depth === 2) {
        const text = node.children
          .filter((child) => child.type === "text")
          .map((child) => child.value)
          .join("")
          .trim();
        const tocRegex = /(table[ -]of[ -])?contents?|toc/i;
        return !tocRegex.test(text);
      }
      return true;
    });
    return tree;
  };
};

// Rehype plugins
const rehypeAbsoluteUrls: Plugin<[UrlLike], HastRoot> = (baseUrl) => {
  return (tree) => {
    const visit = (node: RootContent | HastRoot) => {
      if (node.type === "element") {
        if (node.tagName === "a" && node.properties?.href) {
          node.properties.href = createUrl(
            node.properties.href as string,
            baseUrl,
          );
        }
      }
      if ("children" in node) {
        node.children.forEach(visit);
      }
    };
    visit(tree);
    return tree;
  };
};
```

```ts
//index.ts
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
    image：createUrl("/favicon.png", 'https://linglilongyi.com') as string,
    favicon: createUrl("/favicon.ico", 'https://linglilongyi.com') as string,
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
```

我修改了其中的个人信息，并增加了筛选非草稿且仅收录最新的十篇 post 的功能。里面还有一些功能其实我用不太上，但既然只在编译的时候用到，也不影响网页性能，就放着不管了。

还有一点是，之前我的订阅中文章 id 的格式是 `https://www.linglilongyi.com/posts/${slug}`，而 George 的实现中则直接用文件的 id 即带有文件后缀的路径作为路由。为了统一实现，我也重命名了 url。

更新: folo 抓取 favicon 并不能通过 website/favicon.ico 或者 feed 中的 icon 标签，需要添加 image 标签。
## 结语
至此订阅的折腾暂时告一段落~