import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Bot, User, Trash2, ArrowRight, CornerDownLeft, AlertCircle } from "lucide-react";
import { SegmentStats } from "../types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIInsightsPanelProps {
  segmentStats: SegmentStats[];
}

export default function AIInsightsPanel({ segmentStats }: AIInsightsPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: `👋 **Welcome to the Bestchoice AI Growth Intelligence Center!**

I am your **AI Growth Specialist**, grounded in your real-time customer ledger statistics. I'm ready to answer any questions about your customer behaviors, loyalty cohorts, or marketing campaign ideas.

**Here is what you can ask me:**
- "How can we increase the purchase frequency of our *About to Sleep* group?"
- "Draft a high-impact re-engagement workflow for our *At Risk* segment."
- "Explain how Recency, Frequency, and Monetary parameters calculate Customer Lifetime Value (CLV)."
- "Give me 3 actionable ways to transition *Loyal Customers* into *Champions*."

Let me know what you would like to brainstorm!`,
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorString, setErrorString] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logic when a new message appears
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Pre-configured loyalty suggestion chips
  const suggestionChips = [
    {
      label: "📈 CLV Expansion",
      prompt: "Give me 3 actionable tips to increase the average order value (AOV) and customer lifetime value (CLV) across all active segments."
    },
    {
      label: "🔔 Winback Campaigns",
      prompt: "What specific discount or loyalty campaign works best for winning back 'Hibernating / Lost' and 'Can't Lose Them' customers?"
    },
    {
      label: "💎 VIP Premium Care",
      prompt: "How do we maximize the retention rate and brand advocacy of our 'Champions / Power Users' segment?"
    },
    {
      label: "📊 Segment Breakdown",
      prompt: "Can you analyze our current customer segment list and advise which group offers the largest immediate revenue growth potential?"
    }
  ];

  const handleSendMessage = async (textToSend: string) => {
    const trimmedText = textToSend.trim();
    if (!trimmedText) return;

    // 1. Append user message
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: trimmedText,
      timestamp: new Date()
    };

    setInputValue("");
    setErrorString(null);
    setLoading(true);

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      // 2. Format history for our endpoint
      const formattedHistory = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // 3. Post request to our chatbot API
      const response = await fetch("/api/growth-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedHistory,
          segmentStatsContext: segmentStats
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "The AI system failed to compile response.");
      }

      // 4. Append assistant reply
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorString(err.message || "An error occurred calling the Bestchoice AI engine.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your current conversation history?")) {
      setMessages([
        {
          id: "welcome-reset",
          role: "assistant",
          content: "Chat history cleared. Grounded in your ledger stats, what customer analytics questions can I answer for you now?",
          timestamp: new Date()
        }
      ]);
      setErrorString(null);
    }
  };

  // Safe client-side markdown formatter for precise styles
  const parseInlineElements = (text: string): React.ReactNode[] => {
    const boldRegex = /(\*\*.*?\*\*)/g;
    const parts = text.split(boldRegex);
    return parts.map((part, index) => {
      // Bold handling
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-zinc-950 dark:text-zinc-50 bg-zinc-100/40 dark:bg-zinc-800/20 px-0.5 rounded-sm">
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Inline code or highlighted metrics
      const codeRegex = /`([^`]+)`/g;
      if (part.includes("`")) {
        const subParts = part.split(/`([^`]+)`/);
        return (
          <span key={index}>
            {subParts.map((sub, i) => {
              if (i % 2 === 1) {
                return (
                  <code key={i} className="font-mono text-[11px] font-bold bg-muted bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                    {sub}
                  </code>
                );
              }
              return sub;
            })}
          </span>
        );
      }
      return part;
    });
  };

  const parseMarkdownLine = (line: string, lineIndex: number): React.ReactNode => {
    const trimmed = line.trim();

    // 1. Headings
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={lineIndex} className="text-xs font-bold text-zinc-950 dark:text-zinc-50 uppercase tracking-wider mt-4 pb-1 select-text">
          {parseInlineElements(trimmed.substring(4))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={lineIndex} className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight mt-5 pb-1 select-text">
          {parseInlineElements(trimmed.substring(3))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={lineIndex} className="text-base font-black text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-1.5 mt-5 mb-2 select-text">
          {parseInlineElements(trimmed.substring(2))}
        </h2>
      );
    }

    // 2. Unordered Bullet lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div key={lineIndex} className="flex items-start gap-2 ml-4 my-1 select-text">
          <span className="text-blue-600 dark:text-blue-400 mt-1 select-none font-bold">▪</span>
          <span className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold leading-relaxed">
            {parseInlineElements(trimmed.substring(2))}
          </span>
        </div>
      );
    }

    // 3. Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      const number = numMatch[1];
      const content = numMatch[2];
      return (
        <div key={lineIndex} className="flex items-start gap-2 ml-4 my-1 select-text">
          <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-[11px] mt-0.5 select-none">{number}.</span>
          <span className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold leading-relaxed">
            {parseInlineElements(content)}
          </span>
        </div>
      );
    }

    // 4. Empty block spacer
    if (!trimmed) {
      return <div key={lineIndex} className="h-2" />;
    }

    // 5. Standard paragraph text line
    return (
      <p key={lineIndex} className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold leading-relaxed my-1 select-text">
        {parseInlineElements(line)}
      </p>
    );
  };

  const renderContentWithFormatting = (content: string) => {
    const lines = content.split("\n");
    return (
      <div className="space-y-1 select-text">
        {lines.map((line, i) => parseMarkdownLine(line, i))}
      </div>
    );
  };

  return (
    <div id="ai-insights-panel-wrapper" className="w-full max-w-5xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[650px]">
      
      {/* Dynamic Header */}
      <div id="ai-insights-header" className="px-6 py-4.5 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-sm tracking-tight flex items-center gap-1.5 select-none">
              Bestchoice AI Growth Copilot
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 font-extrabold block leading-none">
                ACTIVE OPERATIONS
              </span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold tracking-tight mt-0.5 select-none">
              Grounded conversational recommendations updated to your raw cohort distribution segments.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <button
          id="clear-chat-btn"
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 rounded-lg text-[10px] text-zinc-500 font-bold tracking-tight transition cursor-pointer shrink-0"
          title="Reset Conversational History"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear Log
        </button>
      </div>

      {/* Main chat body thread stream */}
      <div id="ai-insights-chat-log" className="flex-1 p-6 overflow-y-auto bg-zinc-50/20 dark:bg-zinc-950/10 space-y-4">
        {messages.map((msg) => {
          const isAI = msg.role === "assistant";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 max-w-[85%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                isAI 
                  ? "bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" 
                  : "bg-zinc-900 text-white dark:bg-zinc-1 dark:text-zinc-900"
              }`}>
                {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div className={`p-4.5 rounded-2xl relative shadow-xs leading-normal select-text ${
                isAI
                  ? "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm"
                  : "bg-blue-600 text-white rounded-tr-sm font-semibold text-xs"
              }`}>
                {isAI ? (
                  renderContentWithFormatting(msg.content)
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed select-text">{msg.content}</p>
                )}
                
                <span className={`block text-[9px] mt-2 block select-none ${isAI ? "text-zinc-450 dark:text-zinc-550 font-medium" : "text-blue-105 font-bold"}`}>
                  {msg.timestamp.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Dynamic AI loader bubble */}
        {loading && (
          <div className="flex items-start gap-4 max-w-[80%] mr-auto animate-pulse select-none">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 shrink-0">
              <Bot className="h-4 w-4 animate-bounce" />
            </div>
            <div className="bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2 shadow-xs">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 tracking-tight animate-pulse">
                Auditing cohort matrices and calculating re-engagement strategies...
              </span>
              <div className="flex gap-1.5 pl-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {/* Inline error alerts */}
        {errorString && (
          <div id="chat-api-error" className="p-4.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3 text-xs max-w-xl mx-auto">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
            <div className="space-y-1">
              <p className="font-extrabold">Copilot Request Interrupted</p>
              <p className="leading-relaxed font-semibold">{errorString}</p>
            </div>
          </div>
        )}

        {/* Reference marker for auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips and Input Control deck */}
      <div id="ai-insights-control-deck" className="px-6 py-5.5 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/60 space-y-4">
        
        {/* Chips row */}
        <div id="suggestion-chips-grid" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
          {suggestionChips.map((chip, idx) => (
            <button
              id={`chip-${idx}`}
              key={idx}
              onClick={() => handleSendMessage(chip.prompt)}
              disabled={loading}
              className="px-3 py-2 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/80 bg-white dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-[10px] font-bold tracking-tight transition shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              {chip.label}
              <ArrowRight className="h-3 w-3 text-zinc-400" />
            </button>
          ))}
        </div>

        {/* Dynamic chat input */}
        <form
          id="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex items-center gap-2.5"
        >
          <div className="flex-1 relative">
            <input
              id="chatbot-prompt-input"
              type="text"
              required
              disabled={loading}
              placeholder="Ask me anything about customer retention strategies, discount incentives, or cohort statistics..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full pl-4.5 pr-14 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 disabled:bg-zinc-50 dark:disabled:bg-zinc-950/40 disabled:cursor-not-allowed text-xs font-bold rounded-2xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 placeholder-zinc-400 shadow-inner"
            />
            {/* Corner decorator text */}
            <span className="absolute right-3.5 top-3.5 hidden sm:flex items-center gap-0.5 text-[9px] text-zinc-400 font-extrabold select-none bg-zinc-50 dark:bg-zinc-800 px-1 py-0.5 rounded border border-zinc-150 dark:border-zinc-800">
              <CornerDownLeft className="h-2 w-2" />
              Enter
            </span>
          </div>

          <button
            id="submit-prompt-btn"
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-750 text-white disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10 aspect-square"
            title="Send growth query"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
