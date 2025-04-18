// source: https://github.com/gsong/personal-site/blob/main/src/pages/atom.xml.ts
import type { APIContext } from "astro";

import { generateFeed } from "@/utils/feeds";

export async function GET(context: APIContext) {
  const feed = await generateFeed(context);
  return new Response(feed.atom1(), {
    headers: { "Content-Type": "application/atom+xml" },
  });
}