import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.192.0/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const promtiorSlideDeckPdfPath = join(__dirname, "../static/ai-engineer.pdf");

export const DOC_CONTEXT_FILE_URL = Deno.env.get("DOC_CONTEXT_FILE_URL") ??
  promtiorSlideDeckPdfPath;
