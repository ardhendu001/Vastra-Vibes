import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, FileText } from 'lucide-react';
import { ChatMessage, TrendReport } from '../types';
import { chatWithGemini, initializeChatSession } from '../services/geminiService';

interface Props {
  report: TrendReport | null;
}

const ChatBot: React.FC<Props> = ({ report }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: "Namaste! I'm Vastra. Ready to optimize your inventory?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Re-initialize chat when report changes
  useEffect(() => {
    if (report) {
      initializeChatSession(report);
      
      // Add a system message indicating context awareness
      const contextMsg: ChatMessage = {
        id: Date.now().toString(),
        text: `I've analyzed the **${report.best_seller_concept.product_name}**. Ask me about the **${report.winning_attributes.silhouette}** silhouette, **${report.manufacturing_specs.fabric_primary}** costs, or current market demand!`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, contextMsg]);
      // Optional: auto-open chat when report is ready
      // setIsOpen(true); 
    }
  }, [report]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const responseText = await chatWithGemini(userMsg.text);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: error.message || "Sorry, I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render message text with simple formatting
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
        // Basic bold handling
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <div key={i} className="min-h-[1.2em]">
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith('http')) {
                         return <a key={j} href={part} target="_blank" rel="noreferrer" className="underline text-brand-200 dark:text-brand-300">{part}</a>;
                    }
                    return part;
                })}
            </div>
        );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 hover:shadow-brand-500/50 group ${
          isOpen ? 'bg-slate-900 dark:bg-white rotate-90' : 'bg-gradient-to-r from-brand-600 to-brand-500'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white dark:text-slate-900" /> : <MessageSquare className="w-6 h-6 text-white group-hover:animate-bounce" />}
        {report && !isOpen && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-28 right-8 w-[24rem] max-w-[calc(100vw-3rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 dark:border-slate-700 z-40 transition-all duration-500 origin-bottom-right transform flex flex-col overflow-hidden ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'
        }`}
        style={{ height: '600px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 p-6 flex items-center relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="bg-white/20 p-2.5 rounded-2xl mr-4 backdrop-blur-sm border border-white/20 shadow-lg relative z-10">
                <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="relative z-10 flex-1">
                <h3 className="font-bold text-white text-lg tracking-tight">Vastra Assistant</h3>
                <div className="flex items-center text-brand-100 text-xs font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${report ? 'bg-green-400 animate-pulse' : 'bg-slate-300'}`}></span>
                    {report ? 'Report Context Active' : 'General Mode'}
                </div>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/50 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-4 text-sm shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-brand-600 dark:to-brand-800 text-white rounded-[1.3rem] rounded-br-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-[1.3rem] rounded-bl-sm'
                }`}
              >
                {renderMessageText(msg.text)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-[1.3rem] rounded-bl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce animation-delay-400"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 focus-within:border-brand-300 dark:focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-100 dark:focus-within:ring-brand-900/30 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={report ? `Ask about ${report.best_seller_concept.product_name}...` : "Ask about fabrics..."}
              className="flex-grow px-4 py-2 bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-brand-500 text-white rounded-full hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 transition-all shadow-md hover:shadow-lg transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBot;