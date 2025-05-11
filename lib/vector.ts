import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.192.0/path/mod.ts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const __dirname = dirname(fromFileUrl(import.meta.url));

const promtiorSlideDeckPath = join(__dirname, "../static/ai-engineer.pdf");

const llm = new ChatOllama({
  model: "llama3",
  temperature: 0,
  maxRetries: 2,
});

const embeddings = new OllamaEmbeddings({
  model: "mxbai-embed-large",
  baseUrl: "http://localhost:11434",
});

const vectorStore = new MemoryVectorStore(embeddings);

const loader = new PDFLoader(promtiorSlideDeckPath);

const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const allSplits = await splitter.splitDocuments(docs);

await vectorStore.addDocuments(allSplits);
