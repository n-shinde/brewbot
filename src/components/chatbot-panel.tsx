"use client";

import { useState } from "react";
import { chatWithGemini, type ChatMessage } from "@/lib/api";

type Props = {
  // optional: pass nearby shops so the bot can reference their names/addresses
  context?: any;
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
    } catch (e: any) {
      setMessages([
        ...next,
        { role: "assistant", content: e?.message || "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className ?? "rounded-2xl border p-4 bg-card/60"}>
      <div className="text-sm font-semibold mb-2">Review Assistant</div>

      <div className="space-y-2 max-h-[50vh] overflow-auto border rounded-md p-3 bg-background">
        {messages.map((m, i) => (
          <div key={i} className="text-sm">
            <span className="font-medium">{m.role === "user" ? "You" : "Assistant"}:</span>{" "}
            <span className={m.role === "assistant" ? "text-foreground" : "text-foreground"}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground">Thinking…</div>}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Paste a few review excerpts or ask about a shop…"
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
