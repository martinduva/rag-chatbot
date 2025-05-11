import { Handlers } from "$fresh/server.ts";
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
        try {
          for await (
            const [_, chunk] of await graph.stream(
              { question },
              { streamMode: ["messages"] },
            )
          ) {
            let text = "";
            if (Array.isArray(chunk)) {
              const msg = chunk[0] as any;
              text = msg.kwargs?.content ?? msg.content ?? "";
            } else if (typeof chunk === "string") {
              text = chunk;
            } else if ("token" in chunk) {
              text = (chunk as any).token;
            } else if ("content" in chunk) {
              text = (chunk as any).content;
            }
            if (text) {
              controller.enqueue(encoder.encode(`${text}`));
            }
          }
        } catch (err) {
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
