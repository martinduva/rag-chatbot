import { useState } from "preact/hooks";
import ChatInput from "../components/ChatInput.tsx";
import MessageList from "../components/MessageList.tsx";

export default function Chat() {
  const [messages, setMessages] = useState<
    { sender: "user" | "bot"; text: string }[]
  >([]);

  const sendQuery = async (query: string) => {
    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setMessages((prev) => [...prev, { sender: "bot", text: "" }]);

    const response = await fetch(
      `/api/chat?question=${encodeURIComponent(query)}`,
    );
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunk = decoder.decode(value || new Uint8Array(), { stream: true });
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [
          ...prev.slice(0, -1),
          { sender: "bot", text: last.text + chunk },
        ];
      });
    }
  };

  return (
    <div class="space-y-4">
      <MessageList messages={messages} />
      <ChatInput onSend={sendQuery} />
    </div>
  );
}
