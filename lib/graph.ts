import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import {
  BaseCheckpointSaver,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { toolsCondition } from "@langchain/langgraph/prebuilt";

import { docs } from "./documents.ts";
import { llm } from "./models.ts";
import { splitter } from "./text-splitter.ts";
import { retrieve, tools } from "./tools.ts";
import { vectorStore } from "./vector-store.ts";

const allSplits = await splitter.splitDocuments(docs);
await vectorStore.addDocuments(allSplits);

async function queryOrRespond(state: typeof MessagesAnnotation.State) {
  const llmWithTools = llm.bindTools([retrieve]);
  const response = await llmWithTools.invoke(state.messages);
  return { messages: [response] };
}

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

const graphBuilder = (checkpointer: BaseCheckpointSaver) => {
  const graph = new StateGraph(MessagesAnnotation)
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

  return graph.compile({ checkpointer });
};

const checkpointer = new MemorySaver();

const graphWithMemory = graphBuilder(checkpointer);

export { graphWithMemory as graph };
