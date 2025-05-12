import { useState } from "preact/hooks";

interface Props {
  onSend: (q: string) => void;
}
export default function ChatInput({ onSend }: Props) {
  const [query, setQuery] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend(query);
        setQuery("");
      }}
      class="flex gap-2"
    >
      <input
        class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={query}
        onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        placeholder="Type your question..."
      />
      <button
        type="submit"
        class="bg-blue-600 text-white font-medium px-4 py-2 rounded disabled:opacity-50"
        disabled={!query}
      >
        Send
      </button>
    </form>
  );
}
