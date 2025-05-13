import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.192.0/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const promtiorSlideDeckPdfPath = join(__dirname, "../static/ai-engineer.pdf");

export const PROMTIOR_PDF_SRC = Deno.env.get("PROMTIOR_PDF_URL") ??
  promtiorSlideDeckPdfPath;

export const PROMTIOR_WEBSITE_SRC = Deno.env.get("PROMTIOR_WEBSITE_URL") ??
  "https://www.promtior.ai/service";
