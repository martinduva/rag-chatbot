import "cheerio";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.192.0/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const promtiorSlideDeckPdfPath = join(
  __dirname,
  "../static/promtior-slides.pdf",
);

export const PROMTIOR_PDF_SRC = Deno.env.get("PROMTIOR_PDF_URL") ??
  promtiorSlideDeckPdfPath;

export const PROMTIOR_WEBSITE_SRC = Deno.env.get("PROMTIOR_WEBSITE_URL") ??
  "https://www.promtior.ai/service";

const pdfLoader = new PDFLoader(PROMTIOR_PDF_SRC);
const webLoader = new CheerioWebBaseLoader(PROMTIOR_WEBSITE_SRC, {
  selector: "main",
});

const [pdfDocs, webDocs] = await Promise.all([
  pdfLoader.load(),
  webLoader.load(),
]);

export const documents = [...pdfDocs, ...webDocs];
