"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2, Bot, User, Sparkles, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Diseña una sesión de 60 min para un grupo de nivel intermedio",
  "Sesión de calentamiento y técnica básica para principiantes",
  "Plan de entrenamiento físico para jugadores de competición",
  "Sesión táctica centrada en el juego de red para parejas",
];

function MessageBubble({ role, content }: { role: string; content: string }) {
  const isAssistant = role === "assistant";
  const rendered = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br />");

  return (
    <div className={cn("flex gap-3", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <div className="size-7 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="size-3.5 text-brand" />
        </div>
      )}
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isAssistant
          ? "bg-card border border-border text-foreground rounded-tl-sm"
          : "bg-brand text-brand-foreground rounded-tr-sm"
      )}>
        <span dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
      {!isAssistant && (
        <div className="size-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
          <User className="size-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function DrPlannerPage() {
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/dr-planner",
    }),
  });

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "streaming" || status === "submitted";
  const isEmpty = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function handleSuggestion(text: string) {
    setInput(text);
    textareaRef.current?.focus();
  }

  function getMessageText(message: (typeof messages)[number]) {
    return message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .filter(Boolean)
      .join("\n");
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-dvh">

      {/* Header */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-4 border-b border-border bg-card/50 backdrop-blur shrink-0">
        <Link href="/sessions"
          className="size-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="size-8 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0">
            <Bot className="size-4 text-brand" />
          </div>
          <div>
            <h1 className="font-heading font-semibold text-base text-foreground leading-none">Dr. Planner</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Asistente de entrenamiento con IA</p>
          </div>
          <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
            <Sparkles className="size-2.5" /> IA
          </span>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted">
            <RotateCcw className="size-3.5" /> Nueva
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 max-w-lg mx-auto text-center pb-4">
            <div className="size-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Bot className="size-8 text-brand" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">
                Hola, soy Dr. Planner
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tu asistente de IA para diseñar sesiones de pádel. Cuéntame el nivel del grupo, el tiempo disponible y los objetivos — y crearé un plan completo para ti.
              </p>
            </div>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => handleSuggestion(s)}
                  className="text-left text-xs text-muted-foreground bg-muted/50 hover:bg-muted border border-border hover:border-brand/30 rounded-xl px-3.5 py-3 transition-all hover:text-foreground">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4 max-w-2xl mx-auto">
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={getMessageText(m)} />
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="size-7 rounded-full bg-brand/15 border border-brand/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-3.5 text-brand" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 md:px-6 py-4 border-t border-border bg-card/50 backdrop-blur">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end bg-background border border-border rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-brand/30 focus-within:border-brand/50 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe la sesión que necesitas… (Intro para enviar)"
              rows={1}
              className="flex-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground resize-none max-h-32 py-1"
            />
            <button type="button" onClick={submit} disabled={!input.trim() || isLoading}
              className="size-8 rounded-xl bg-brand text-brand-foreground flex items-center justify-center hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Dr. Planner puede cometer errores. Revisa siempre los planes antes de usarlos.
          </p>
        </div>
      </div>
    </div>
  );
}
