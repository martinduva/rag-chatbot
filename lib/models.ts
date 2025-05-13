import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";

const LLAMA_MODEL = Deno.env.get("LLAMA_MODEL") ?? "llama3.2";
const EMBEDDING_MODEL = Deno.env.get("EMBEDDING_MODEL") ?? "mxbai-embed-large";
const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL") ?? "localhost:11434";

export const llm = new ChatOllama({
  model: LLAMA_MODEL,
  baseUrl: OLLAMA_BASE_URL,
  temperature: 0.5,
  maxRetries: 2,
});

export const embeddings = new OllamaEmbeddings({
  model: EMBEDDING_MODEL,
  baseUrl: OLLAMA_BASE_URL,
});
