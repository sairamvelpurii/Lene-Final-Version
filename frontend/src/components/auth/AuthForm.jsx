import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
import FloatingInput from "../ui/FloatingInput";
import Button from "../ui/Button";
import api from "../../api";

const FEATURES = [
 { icon: Sparkles, title: "AI-Powered Insights", desc: "Get smart recommendations on your spending habits" },
 { icon: TrendingUp, title: "Expense Tracking", desc: "Track & analyze every transaction automatically" },
 { icon: ShieldCheck, title: "Budget Planning", desc: "Set goals and stay on track with intelligent alerts" },
];

export default function AuthForm({ onAuth }) {
 const [isLogin, setIsLogin] = useState(true);
 const [form, setForm] = useState({ name: "", email: "", password: "" });
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const [showPass, setShowPass] = useState(false);

 async function submit(e) {
 e.preventDefault();
 setError("");
 setLoading(true);
 try {
 const endpoint = isLogin ? "/auth/login" : "/auth/register";
 const payload = isLogin ? { email: form.email, password: form.password } : form;
 const { data } = await api.post(endpoint, payload);
 onAuth(data.token, data.user);
 } catch (err) {
 if (err.response) {
 setError(err.response.data?.error || "Authentication failed");
 } else if (err.code === "ERR_NETWORK" || !err.response) {
 setError("Cannot reach the server. Please try again later.");
 } else {
 setError("Something went wrong. Please try again.");
 }
 } finally {
 setLoading(false);
 }
 }

 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-violet-50 p-4 sm:p-6">
 {/* Decorative blobs */}
 <div className="pointer-events-none fixed inset-0 overflow-hidden">
 <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
 <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
 </div>

 <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:gap-16">
 {/* Left — Branding */}
 <motion.div
 initial={{ opacity: 0, x: -24 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.6 }}
 className="hidden lg:flex flex-col justify-center"
 >
 <div className="mb-6 flex items-center gap-3">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white font-bold text-xl shadow-lg">
 L
 </div>
 <span className="text-2xl font-bold text-gray-800">LENE-Smart-Tracer</span>
 </div>
 <h1 className="mb-4 text-4xl font-extrabold leading-tight text-gray-900">
 Smart Finance,{" "}
 <span className="text-gradient">Smarter Decisions</span>
 </h1>
 <p className="mb-10 max-w-md text-base text-gray-500 leading-relaxed">
 Your AI-powered personal finance assistant that helps you track spending, optimize budgets, and build wealth — effortlessly.
 </p>

 <div className="space-y-5">
 {FEATURES.map((f, i) => (
 <motion.div
 key={f.title}
 initial={{ opacity: 0, x: -16 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.3 + i * 0.15 }}
 className="flex items-start gap-4"
 >
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
 <f.icon size={20} />
 </div>
 <div>
 <p className="font-semibold text-gray-800">{f.title}</p>
 <p className="text-sm text-gray-500">{f.desc}</p>
 </div>
 </motion.div>
 ))}
 </div>
 </motion.div>

 {/* Right — Auth Form */}
 <motion.div
 initial={{ opacity: 0, y: 24 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="flex items-center"
 >
 <div className="w-full rounded-3xl border border-surface-200 bg-white/90 p-8 shadow-card backdrop-blur-xl sm:p-10">
 {/* Mobile logo */}
 <div className="mb-6 flex items-center gap-3 lg:hidden">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-lg shadow-md">
 L
 </div>
 <span className="text-lg font-bold text-gray-800">LENE-Smart-Tracer</span>
 </div>

 <h2 className="mb-1 text-2xl font-bold text-gray-900">
 {isLogin ? "Welcome back" : "Create your account"}
 </h2>
 <p className="mb-6 text-sm text-gray-500">
 {isLogin ? "Sign in to access your financial dashboard" : "Start your journey to smarter finances"}
 </p>

 <form onSubmit={submit} className="space-y-4">
 <AnimatePresence mode="wait">
 {!isLogin && (
 <motion.div
 key="name-field"
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 exit={{ opacity: 0, height: 0 }}
 transition={{ duration: 0.25 }}
 >
 <FloatingInput
 label="Full Name"
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 required
 />
 </motion.div>
 )}
 </AnimatePresence>

 <FloatingInput
 label="Email Address"
 type="email"
 value={form.email}
 onChange={(e) => setForm({ ...form, email: e.target.value })}
 required
 />

 <div className="relative">
 <FloatingInput
 label="Password"
 type={showPass ? "text" : "password"}
 value={form.password}
 onChange={(e) => setForm({ ...form, password: e.target.value })}
 required
 />
 <button
 type="button"
 onClick={() => setShowPass((v) => !v)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
 >
 {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 </div>

 <AnimatePresence>
 {error && (
 <motion.p
 initial={{ opacity: 0, y: -6 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -6 }}
 className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-100"
 >
 {error}
 </motion.p>
 )}
 </AnimatePresence>

 <Button
 type="submit"
 disabled={loading}
 className="w-full py-3 text-base"
 >
 {loading ? (
 <span className="flex items-center gap-2">
 <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
 <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
 <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
 </svg>
 Processing...
 </span>
 ) : isLogin ? "Sign In" : "Create Account"}
 </Button>
 </form>

 <div className="mt-6 text-center">
 <button
 type="button"
 onClick={() => { setIsLogin((v) => !v); setError(""); }}
 className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
 >
 {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 </div>
 );
}
