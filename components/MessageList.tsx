interface Message {
  sender: "user" | "bot";
  text: string;
}

interface Props {
  messages: Message[];
}

export default function MessageList({ messages }: Props) {
  return (
    <div class="space-y-4 max-h-[60vh] overflow-y-auto">
      {messages.map((m, i) => (
        <div
          key={i}
          class={m.sender === "user"
            ? "flex justify-end"
            : "flex justify-start"}
        >
          <span
            class={`inline-block px-4 py-2 rounded-lg ` +
              (m.sender === "user"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800")}
          >
            {m.text}
          </span>
        </div>
      ))}
    </div>
  );
}
