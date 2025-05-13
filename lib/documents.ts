import "cheerio";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

import { PROMTIOR_PDF_SRC, PROMTIOR_WEBSITE_SRC } from "./context.ts";

const pdfLoader = new PDFLoader(PROMTIOR_PDF_SRC);
const webLoader = new CheerioWebBaseLoader(PROMTIOR_WEBSITE_SRC, {
  selector: "main",
});

const [pdfDocs, webDocs] = await Promise.all([
  pdfLoader.load(),
  webLoader.load(),
]);

export const documents = [...pdfDocs, ...webDocs];
