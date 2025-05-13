import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.192.0/path/mod.ts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { z } from "zod";

import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

const __dirname = dirname(fromFileUrl(import.meta.url));
const promtiorSlideDeckPath = join(__dirname, "../static/ai-engineer.pdf");

const LLAMA_MODEL = Deno.env.get("LLAMA_MODEL") ?? "llama3.2";
const EMBEDDING_MODEL = Deno.env.get("EMBEDDING_MODEL") ??
  "mxbai-embed-large";
const OLLAMA_BASE_URL = Deno.env.get("OLLAMA_BASE_URL") ?? "localhost:11434";

const llm = new ChatOllama({
  model: LLAMA_MODEL,
  baseUrl: OLLAMA_BASE_URL,
  temperature: 0.5,
  maxRetries: 2,
});

const embeddings = new OllamaEmbeddings({
  model: EMBEDDING_MODEL,
  baseUrl: OLLAMA_BASE_URL,
});

const vectorStore = new MemoryVectorStore(embeddings);
const loader = new PDFLoader(promtiorSlideDeckPath);
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 500,
});

const allSplits = await splitter.splitDocuments(docs);
await vectorStore.addDocuments(allSplits);

const retrieveSchema = z.object({ query: z.string() });
const retrieve = tool(
  async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
    const serialized = retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`,
      )
      .join("\n");
    return [serialized, retrievedDocs];
  },
  {
    name: "retrieve",
    description: "Retrieve information related to a query.",
    schema: retrieveSchema,
    responseFormat: "content_and_artifact",
  },
);

async function queryOrRespond(state: typeof MessagesAnnotation.State) {
  const llmWithTools = llm.bindTools([retrieve]);
  const response = await llmWithTools.invoke(state.messages);
  return { messages: [response] };
}

const tools = new ToolNode([retrieve]);

async function generate(state: typeof MessagesAnnotation.State) {
  const recentToolMessages = [];
  for (let i = state["messages"].length - 1; i >= 0; i--) {
    const message = state["messages"][i];
    if (message instanceof ToolMessage) {
      recentToolMessages.push(message);
    } else {
      break;
    }
  }
  const toolMessages = recentToolMessages.reverse();
  const docsContent = toolMessages.map((doc) => doc.content).join("\n");
  const systemMessageContent =
    "You are an assistant for question-answering tasks. " +
    "Use the following pieces of retrieved context to answer " +
    "the question. Ignore the fact that the provided context comes" +
    "from an interview challenge. Don't mention anything about the" +
    "technical test. Act as if you were to respond just to questions" +
    "about the company. If you don't know the answer, say that" +
    "you don't know, but just if you have no idea, if at least you have" +
    "some information say it without hesitating. Use three sentences" +
    "maximum and keep the answer concise." +
    "\n\n" +
    `${docsContent}`;

  const conversationMessages = state.messages.filter(
    (message) =>
      message instanceof HumanMessage ||
      message instanceof SystemMessage ||
      (message instanceof AIMessage && message.tool_calls?.length == 0),
  );

  const prompt = [
    new SystemMessage(systemMessageContent),
    ...conversationMessages,
  ];

  const response = await llm.invoke(prompt);
  return { messages: [response] };
}

const graphBuilder = new StateGraph(MessagesAnnotation)
  .addNode("queryOrRespond", queryOrRespond)
  .addNode("tools", tools)
  .addNode("generate", generate)
  .addEdge("__start__", "queryOrRespond")
  .addConditionalEdges("queryOrRespond", toolsCondition, {
    __end__: "__end__",
    tools: "tools",
  })
  .addEdge("tools", "generate")
  .addEdge("generate", "__end__");

const checkpointer = new MemorySaver();

const graphWithMemory = graphBuilder.compile({ checkpointer });

export { graphWithMemory as graph };
