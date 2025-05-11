import { Handlers } from "$fresh/server.ts";
import { prettyPrint } from "../../lib/utils.ts";
import { graph } from "../../lib/vector.ts";

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
        const inputs1 = { messages: [{ role: "user", content: question }] };
        const threadConfig = {
          configurable: { thread_id: "abc123" },
          streamMode: "values" as const,
        };
        try {
          for await (
            const step of await graph.stream(
              inputs1,
              threadConfig,
            )
          ) {
            const lastMessage = step.messages[step.messages.length - 1];
            if (lastMessage) {
              controller.enqueue(
                encoder.encode(prettyPrint(lastMessage)),
              );
            }
          }
        } catch (err) {
          console.error("Error in stream:", err);
          controller.error(err);
        } finally {
          // controller.enqueue(encoder.encode("event: end data: "));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
};
