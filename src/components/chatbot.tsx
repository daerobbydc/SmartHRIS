"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Bot, User, Send, X, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  action: string;
  icon: string;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/chatbot");
      const data = await res.json();
      setQuickActions(data.quickActions || []);
      setSuggestions(data.suggestions || [
        "Sisa cuti saya berapa?",
        "Lihat slip gaji bulan ini",
        "SOP lembur & jam kerja",
      ]);

      if (messages.length === 0) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: "Halo! Saya **SmartHR Assistant**. 👋\nAda yang bisa saya bantu terkait jatah cuti, rincian slip gaji, jam kerja, atau SOP perusahaan?",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch chatbot data:", error);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Terima kasih, ada pertanyaan lain?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, terjadi masalah koneksi ke server AI. Silakan coba lagi.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 text-white shadow-xl hover:shadow-teal-500/25 hover:scale-105 transition duration-200"
      >
        <div className="relative">
          <Bot className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <span className="text-xs font-bold tracking-wide">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[360px] sm:w-[390px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 p-4 text-white">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-bold text-sm leading-tight">SmartHR Assistant</h3>
            <p className="text-[11px] text-teal-100 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Online • AI Powered
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-teal-600 text-white rounded-br-none shadow-sm"
                  : "bg-white text-slate-800 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>

            {msg.role === "user" && (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 mt-0.5">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-xs text-slate-400">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400">Memproses jawaban AI...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 overflow-x-auto whitespace-nowrap">
          <div className="flex gap-1.5 text-xs">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                disabled={isLoading}
                className="rounded-full bg-white dark:bg-slate-700 px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-teal-50 hover:text-teal-600 transition flex-shrink-0"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ketik pertanyaan HR Anda..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs sm:text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-teal-600 p-2 text-white hover:bg-teal-700 disabled:opacity-40 transition shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

