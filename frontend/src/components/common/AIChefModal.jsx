import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User as UserIcon, Loader2 } from "lucide-react";
import API from "@/services/api";

const AIChefModal = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { role: "model", text: "Hi! I'm Pantry Chef. What would you like to cook today?" }
    ]);
    const [inputQuery, setInputQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputQuery.trim()) return;

        const userMsg = { role: "user", text: inputQuery };
        setMessages(prev => [...prev, userMsg]);
        setInputQuery("");
        setIsLoading(true);

        try {
            // Prepare history for Gemini (excluding the initial welcome message if needed, but let's send it too as context)
            const historyForAPI = messages.filter(m => m.text).map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const res = await API.post("/ai", {
                message: userMsg.text,
                history: historyForAPI
            });

            setMessages(prev => [...prev, { role: "model", text: res.data.reply }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "model", text: "Oops, I'm having trouble thinking right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white dark:bg-slate-900 w-full h-[85vh] sm:h-auto sm:max-h-[600px] sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">

                {/* Header */}
                <div className="bg-green-600 dark:bg-green-700 px-5 py-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-tight">Pantry Chef AI</h2>
                            <p className="text-white/80 text-xs">Always here to help you cook</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 dark:bg-slate-950/50 relative">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-gray-200 dark:bg-slate-800' : 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'}`}>
                                {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <Bot className="w-4 h-4" />}
                            </div>

                            {/* Message Bubble */}
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-green-500 text-white rounded-tr-sm'
                                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 rounded-tl-sm'
                                }`}>
                                {/* Simple formatting for Markdown/Newlines if needed, for now just standard text */}
                                <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 shadow-sm">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">Chef is typing...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shrink-0">
                    <div className="flex gap-2 relative">
                        <input
                            type="text"
                            placeholder="Ask for recipes, substitutions..."
                            value={inputQuery}
                            onChange={e => setInputQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            className="flex-1 bg-gray-100 dark:bg-slate-800 border-none rounded-2xl pl-4 pr-12 py-3 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputQuery.trim() || isLoading}
                            className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-green-500 transition-all shadow-sm"
                        >
                            <Send className="w-4 h-4 -ml-0.5" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AIChefModal;
