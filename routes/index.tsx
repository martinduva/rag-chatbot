import { Head } from "$fresh/runtime.ts";
import Chat from "../islands/Chat.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Promtior RAG Chatbot</title>
        <link rel="stylesheet" href="/styles/tailwind.css" />
      </Head>
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="w-full max-w-xl p-4">
          <h1 class="text-3xl font-bold mb-6 text-center">
            Promtior RAG Chatbot
          </h1>
          <Chat />
        </div>
      </div>
    </>
  );
}
