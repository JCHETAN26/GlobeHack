import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Bot, User, Minimize2 } from "lucide-react";
import { sendChatMessage, type ChatResponse } from "@/lib/chatApi";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: string;
  timestamp: string;
  load?: ChatResponse["load"];
}

const SUGGESTIONS = [
  "Who's available right now?",
  "Find a dry van driver from Phoenix to Dallas, 38000 lbs",
  "What's our cost per mile?",
  "Check HOS for Carlos",
  "Show me fleet status",
];

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowSuggestions(false);
    setLoading(true);

    try {
      const response = await sendChatMessage(text.trim());
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
        type: response.type,
        timestamp: response.timestamp,
        load: response.load,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ Error: ${err.message}\n\nMake sure the backend is running on port 3001.`,
        type: "error",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Floating button when closed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary shadow-2xl shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 group"
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground" />
        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-success text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
          AI
        </span>
        {/* Tooltip */}
        <span className="absolute right-16 whitespace-nowrap text-xs font-medium bg-background border border-border shadow-lg rounded-md px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Dispatch Assistant
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[440px] h-[640px] flex flex-col rounded-2xl border border-border bg-background shadow-2xl shadow-black/30 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white">DispatchIQ Assistant</h3>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Online · Natural language dispatch
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="h-7 w-7 rounded-md hover:bg-sidebar-accent flex items-center justify-center transition-colors"
        >
          <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => { setOpen(false); setMessages([]); setShowSuggestions(true); }}
          className="h-7 w-7 rounded-md hover:bg-sidebar-accent flex items-center justify-center transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-8">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Hey! I'm your dispatch AI.</h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[280px] mx-auto">
              Ask me anything — find drivers, check HOS, pull costs. Just type in plain English.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="h-6 w-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted/60 border border-border rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <MarkdownContent content={msg.content} />
              ) : (
                <span>{msg.content}</span>
              )}
              {msg.load && (
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground/70">{msg.load.pickup}</span>
                  <span>→</span>
                  <span className="font-medium text-foreground/70">{msg.load.dropoff}</span>
                  <span>·</span>
                  <span>{msg.load.distance}</span>
                  <span>·</span>
                  <span className="font-bold text-success">{msg.load.rate}</span>
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="h-6 w-6 rounded-md bg-foreground/10 border border-border flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5 text-foreground/60" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="h-6 w-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-muted/60 border border-border rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length === 0 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2">Try asking…</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-muted/30 text-foreground/80 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-1.5 focus-within:border-primary/50 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about loads, drivers, HOS, costs…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-1"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="h-8 w-8 rounded-lg bg-primary/90 hover:bg-primary flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-primary/90 shrink-0"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 text-primary-foreground" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          Powered by DispatchIQ NLP · Type <span className="font-medium text-foreground/60">help</span> for commands
        </p>
      </div>
    </div>
  );
}

/** Simple markdown-to-JSX renderer for chat messages */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  let inTable = false;
  let tableRows: string[][] = [];

  while (i < lines.length) {
    const line = lines[i];

    // Headers
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold mt-2 mb-1 flex items-center gap-1.5">
          {line.slice(3)}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-xs font-bold text-foreground/90 mt-2 mb-1 uppercase tracking-wide">
          {line.slice(4)}
        </h4>
      );
      i++;
      continue;
    }

    // Table detection
    if (line.startsWith("|") && line.endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator rows
      if (!/^\|[-\s|]+\|$/.test(line)) {
        const cells = line.split("|").slice(1, -1).map((c) => c.trim());
        tableRows.push(cells);
      }
      // Check if next line continues table
      if (i + 1 >= lines.length || !lines[i + 1].startsWith("|")) {
        // Render table
        inTable = false;
        const isHeaderPresent = tableRows.length > 1;
        elements.push(
          <div key={i} className="my-1.5 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-[11px]">
              {isHeaderPresent && (
                <thead>
                  <tr className="bg-muted/40">
                    {tableRows[0].map((cell, ci) => (
                      <th key={ci} className="text-left font-semibold px-2 py-1 text-muted-foreground">
                        {renderInline(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {tableRows.slice(isHeaderPresent ? 1 : 0).map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "" : "bg-muted/20"}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      i++;
      continue;
    }

    // Bullet list
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex items-start gap-1.5 text-[12px] leading-relaxed ml-1">
          <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <div key={i} className="border-l-2 border-primary/40 pl-2.5 text-[11px] text-foreground/80 italic my-1">
          {renderInline(line.slice(2))}
        </div>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-[12px] leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

/** Render bold, italic, and code inline */
function renderInline(text: string): React.ReactNode {
  // Process **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(
        <span key={key++} className="font-bold text-foreground">
          {boldMatch[1]}
        </span>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Code
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
      }
      parts.push(
        <code key={key++} className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/_(.+?)_/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
      }
      parts.push(
        <em key={key++} className="text-foreground/70">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // No more matches
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
