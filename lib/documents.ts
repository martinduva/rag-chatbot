import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DOC_CONTEXT_FILE_URL } from "./context.ts";

const loader = new PDFLoader(DOC_CONTEXT_FILE_URL);
export const docs = await loader.load();
