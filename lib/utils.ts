import { AIMessage, BaseMessage, isAIMessage } from "@langchain/core/messages";

interface PrettyPrintOptions {
  toolCalls?: boolean;
}

export const prettyPrint = (
  message: BaseMessage,
  { toolCalls = false }: PrettyPrintOptions | undefined = {},
) => {
  let txt = `[${message.getType()}]: ${message.content}`;

  if (
    toolCalls && (isAIMessage(message) && message.tool_calls?.length) || 0 > 0
  ) {
    const tool_calls = (message as AIMessage)?.tool_calls
      ?.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`)
      .join("\n");
    txt += ` \nTools: \n${tool_calls}`;
  }

  if (isAIMessage(message) && message.content !== "") {
    return txt;
  }
};
