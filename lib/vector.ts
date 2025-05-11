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

const llm = new ChatOllama({
  model: "llama3.2",
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

// Step 1: Generate an AIMessage that may include a tool-call to be sent.
async function queryOrRespond(state: typeof MessagesAnnotation.State) {
  const llmWithTools = llm.bindTools([retrieve]);
  const response = await llmWithTools.invoke(state.messages);
  // MessagesState appends messages to state instead of overwriting
  return { messages: [response] };
}

// Step 2: Execute the retrieval.
const tools = new ToolNode([retrieve]);

// Step 3: Generate a response using the retrieved content.
async function generate(state: typeof MessagesAnnotation.State) {
  // Get generated ToolMessages
  let recentToolMessages = [];
  for (let i = state["messages"].length - 1; i >= 0; i--) {
    let message = state["messages"][i];
    if (message instanceof ToolMessage) {
      recentToolMessages.push(message);
    } else {
      break;
    }
  }

  let toolMessages = recentToolMessages.reverse();

  // Format into prompt
  const docsContent = toolMessages.map((doc) => doc.content).join("\n");
  const systemMessageContent =
    "You are an assistant for question-answering tasks. " +
    "Use the following pieces of retrieved context to answer " +
    "the question. If you don't know the answer, say that you " +
    "don't know. Use three sentences maximum and keep the " +
    "answer concise." +
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

  // Run
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
