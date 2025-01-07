// @ts-check
import { defineConfig } from 'astro/config';
import charm from "astro-charm";

// https://astro.build/config
export default defineConfig({
  site: 'https://www.linglilongyi.com',
	integrations: [charm({
  config: {
    "lang": "zh-CN",
    "title": "雨霖铃慢",
    "description": "关于爱与美食的博客",
    "author": "绫里龙一",
    "licenseId": "CC0-1.0",
    //其实没有在用，只是要有值才能调用自定义的评论组件
    "giscus": {
      repo: "Yuhanawa/astro-charm",
      repoId: "R_kgDOMk98JQ",
      category: "Blog Post Comments",
      categoryId: "DIC_kwDOMk98Jc4CljB_",
    },
    "side": {
      "title": "雨霖铃慢",
      "sub": "仙人掌de兔子洞",
      "bio": "哀吾生之须臾，羡长江之无穷\
      挟飞仙以遨游，抱明月而长终\
      知不可乎骤得，托遗响于悲风",
      "navHome": {
        "title": "Home",
        "icon": {
          default: "icon-park:carrot",
          hover: "icon-park-outline:carrot",
          active: "icon-park-outline:cactus",
        }
      },
      "footer": [
        {
          "title": "GitHub",
          "link": "https://github.com/linglilongyi",
          "icon": "simple-icons:github"
        }
      ],
    },
    "markdown": {
      "colorizedBrackets": {
        explicitTrigger: true
      }
    }
  },
  overrides: {
    components: {
      Comments: "./src/components/Comments.astro",
    }
  }
})
],
});