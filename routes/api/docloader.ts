import { FreshContext } from "$fresh/server.ts";
import { docs } from "../../lib/vector.ts";

export const handler = (_req: Request, _ctx: FreshContext): Response => {
  return new Response(docs[2].pageContent);
};
