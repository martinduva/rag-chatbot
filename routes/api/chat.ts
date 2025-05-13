import { Handlers } from "$fresh/server.ts";
import { isAIMessageChunk } from "@langchain/core/messages";
import { graph } from "../../lib/graph.ts";

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const question = url.searchParams.get("question");
    if (!question) {
      return new Response(JSON.stringify({ error: "`question` is required" }), {
        status: 400,
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const inputs = { messages: [{ role: "user", content: question }] };
        const threadConfig = {
          configurable: { thread_id: "abc123" },
          streamMode: "messages" as const,
        };
        try {
          for await (
            const [chunk, _meta] of await graph.stream(
              inputs,
              threadConfig,
            )
          ) {
            if (isAIMessageChunk(chunk)) {
              controller.enqueue(
                encoder.encode(chunk.text),
              );
            }
          }
        } catch (err) {
          console.error("Error in stream:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
};
