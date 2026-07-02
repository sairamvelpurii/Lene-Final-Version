import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X } from "lucide-react";
import api from "../../api";

export default function ChatWidget() {
 const [open, setOpen] = useState(false);
 const [messages, setMessages] = useState([
 { role: "assistant", text: "Hi! I'm your AI finance assistant. Ask me about budgets, savings, or spending optimization." },
 ]);
 const [input, setInput] = useState("");
 const [loading, setLoading] = useState(false);
 const bottomRef = useRef(null);

 useEffect(() => {
 bottomRef.current?.scrollIntoView({ behavior: "smooth" });
 }, [messages, loading]);

 async function sendMessage(e) {
 e?.preventDefault();
 if (!input.trim() || loading) return;
 const text = input.trim();
 setInput("");
 setMessages((p) => [...p, { role: "user", text }]);
 setLoading(true);
 try {
 const { data } = await api.post("/chat", { message: text });
 setMessages((p) => [...p, { role: "assistant", text: data.reply }]);
 } catch (err) {
 const errorMsg = err.response?.status === 401
 ? "Session expired. Please log in again."
 : err.response?.data?.error || "Unable to reach assistant right now. Please try again.";
 setMessages((p) => [...p, { role: "assistant", text: errorMsg }]);
 } finally {
 setLoading(false);
 }
 }

 return (
 <div className="fixed bottom-5 right-5 z-50">
 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 transition={{ type: "spring", stiffness: 300, damping: 25 }}
 className="mb-3 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card "
 >
 {/* Header */}
 <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-3 text-white">
 <div className="flex items-center gap-2">
 <Bot size={18} />
 <p className="font-semibold text-sm">AI Finance Assistant</p>
 </div>
 <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/20 transition">
 <X size={16} />
 </button>
 </div>

 {/* Messages */}
 <div className="flex-1 space-y-3 overflow-y-auto p-4">
 {messages.map((m, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
 m.role === "user"
 ? "ml-auto bg-brand-600 text-white rounded-br-md"
 : "bg-surface-100 text-gray-700 rounded-bl-md "
 }`}
 >
 {m.text}
 </motion.div>
 ))}
 {loading && (
 <div className="flex gap-1 px-4 py-2">
 {[0, 1, 2].map((i) => (
 <motion.div
 key={i}
 className="h-2 w-2 rounded-full bg-brand-400"
 animate={{ y: [0, -6, 0] }}
 transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
 />
 ))}
 </div>
 )}
 <div ref={bottomRef} />
 </div>

 {/* Input */}
 <form onSubmit={sendMessage} className="flex gap-2 border-t border-surface-200 p-3 ">
 <input
 value={input}
 onChange={(e) => setInput(e.target.value)}
 placeholder="Ask about your spending..."
 className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 :ring-brand-500/20"
 />
 <button type="submit" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700">
 <Send size={15} />
 </button>
 </form>
 </motion.div>
 )}
 </AnimatePresence>

 {/* FAB */}
 <motion.button
 whileHover={{ scale: 1.08 }}
 whileTap={{ scale: 0.95 }}
 onClick={() => setOpen((v) => !v)}
 className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-purple-600 text-white shadow-lg transition"
 >
 <Bot size={24} />
 {!open && (
 <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
 )}
 </motion.button>
 </div>
 );
}
