import { MemoryVectorStore } from "langchain/vectorstores/memory";

import { embeddings } from "./models.ts";

export const vectorStore = new MemoryVectorStore(embeddings);
