"use client";

import { useState } from "react";
import { chatWithGemini, type ChatMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type Props = {
  // optional: pass nearby shops so the bot can reference their names/addresses
  context?: unknown;
  className?: string;
};

export default function ChatbotPanel({ context, className }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! Tell me which competitor you want to learn more about. I can also compare their business with yours if you provide context on your coffee shop's location, sales, and menu items.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const resp = await chatWithGemini({ messages: next, context });
      setMessages([...next, { role: "assistant", content: resp.content }]);
    } catch (e: unknown) {
      setMessages([
        ...next,
        { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className ?? "rounded-2xl border p-4 bg-card/60"}>
      <div className="text-xl font-medium">
        Competitor Analysis Assistant
      </div>

      {/* Chat history container */}
      <div className="space-y-3 border rounded-md p-3 bg-background max-h-[50vh] overflow-y-auto">
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div
              key={i}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  isUser
                    ? "bg-espresso text-crema text-right"
                    : "bg-muted text-foreground text-left"
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="text-xs text-muted-foreground text-center">
            Thinking... 🤔 💭
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Tell me about your coffee shop or ask about a competitor..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          className="rounded bg-espresso text-crema px-3 py-2 text-sm disabled:opacity-50"
          onClick={send}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
