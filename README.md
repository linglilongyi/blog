雨霖铃慢，是我的个人博客，可能还会不断折腾， 持续不稳定。

---
My blog is powered by Astro with theme [astro-charm](https://github.com/Yuhanawa/astro-charm).

You can clone this repo or build from a new project.

You need to edit  `astro.config.ts`, `public/favicon.svg` for your own site.

There are some changes besides the default setting of astro-charm. I replace the giscus comment with twikoo. You can write your own `Comment.astro` component. I also give a css which add a cactus in the webside background.

You should replace `content/posts` and `content/specials` under `src` to save your own markdown file.

```sh
bun install
bun astro build
```

