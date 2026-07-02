import { motion } from "framer-motion";
import {
 Sparkles, Lightbulb, AlertTriangle, TrendingDown,
 PiggyBank, ShieldCheck, Target, Brain, Zap, ArrowRight
} from "lucide-react";

const fadeUp = (i = 0) => ({
 initial: { opacity: 0, y: 20 },
 animate: { opacity: 1, y: 0 },
 transition: { delay: i * 0.08, duration: 0.4 },
});

function getStyle(text) {
 const l = text.toLowerCase();
 if (l.includes("reduce") || l.includes("optimization") || l.includes("cut"))
 return { border: "border-l-amber-400", icon: AlertTriangle, ic: "text-amber-500", bg: "bg-amber-50 " };
 if (l.includes("savings") || l.includes("invest") || l.includes("aside"))
 return { border: "border-l-emerald-400", icon: TrendingDown, ic: "text-emerald-500", bg: "bg-emerald-50 " };
 if (l.includes("predict"))
 return { border: "border-l-purple-400", icon: Brain, ic: "text-purple-500", bg: "bg-purple-50 " };
 return { border: "border-l-brand-400", icon: Lightbulb, ic: "text-brand-500", bg: "bg-brand-50 " };
}

export default function InsightsPage({ recommendation, summary }) {
 const insights = recommendation?.insights || [];
 const predicted = recommendation?.predicted_next_month_expense || 0;
 const emergency = recommendation?.emergency_fund || 0;
 const savings = recommendation?.suggested_savings || 0;
 const totalSpend = summary?.total_spend || 0;
 const budgetEntries = Object.entries(recommendation?.recommended_budget || {});

 const savingsRate = totalSpend > 0 ? ((savings / totalSpend) * 100).toFixed(0) : 0;

 return (
 <div className="space-y-6">
 {/* Header */}
 <motion.div {...fadeUp(0)} className="pl-12 lg:pl-0">
 <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl flex items-center gap-3">
 <Sparkles className="text-purple-500" size={28} />
 AI Insights
 </h1>
 <p className="mt-1 text-sm text-gray-500 ">
 Personalized recommendations powered by machine learning.
 </p>
 </motion.div>

 {/* Key metrics row */}
 <div className="grid gap-4 sm:grid-cols-3">
 <motion.div {...fadeUp(1)} className="card bg-gradient-to-br from-purple-50 to-brand-50 ">
 <div className="flex items-center gap-3 mb-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 ">
 <Brain size={20} className="text-purple-600 " />
 </div>
 <p className="text-sm font-medium text-gray-500 ">Predicted Next Month</p>
 </div>
 <p className="text-3xl font-extrabold text-gray-900 ">
 ₹{predicted.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
 </p>
 <p className="mt-1 text-xs text-gray-400">Based on your spending patterns</p>
 </motion.div>

 <motion.div {...fadeUp(2)} className="card bg-gradient-to-br from-emerald-50 to-teal-50 ">
 <div className="flex items-center gap-3 mb-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 ">
 <PiggyBank size={20} className="text-emerald-600 " />
 </div>
 <p className="text-sm font-medium text-gray-500 ">Suggested Savings</p>
 </div>
 <p className="text-3xl font-extrabold text-emerald-700 ">
 ₹{savings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
 </p>
 <p className="mt-1 text-xs text-gray-400">{savingsRate}% savings rate target</p>
 </motion.div>

 <motion.div {...fadeUp(3)} className="card bg-gradient-to-br from-amber-50 to-orange-50 ">
 <div className="flex items-center gap-3 mb-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 ">
 <ShieldCheck size={20} className="text-amber-600 " />
 </div>
 <p className="text-sm font-medium text-gray-500 ">Emergency Fund</p>
 </div>
 <p className="text-3xl font-extrabold text-amber-700 ">
 ₹{emergency.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
 </p>
 <p className="mt-1 text-xs text-gray-400">10% of monthly expenses</p>
 </motion.div>
 </div>

 {/* AI Insights cards */}
 <motion.div {...fadeUp(4)} className="card">
 <div className="mb-5 flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 ">
 <Zap size={18} className="text-purple-600 " />
 </div>
 <h3 className="text-base font-semibold text-gray-800 ">Smart Recommendations</h3>
 </div>
 {insights.length === 0 ? (
 <div className="py-12 text-center">
 <Sparkles size={40} className="mx-auto mb-3 text-gray-300 " />
 <p className="text-sm text-gray-400">Add expenses for at least one month to unlock AI insights.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {insights.map((text, i) => {
 const s = getStyle(text);
 return (
 <motion.div key={i}
 initial={{ opacity: 0, x: -16 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.4 + i * 0.12 }}
 className={`flex items-start gap-3 rounded-xl border-l-4 ${s.border} ${s.bg} px-5 py-4`}>
 <s.icon size={18} className={`mt-0.5 shrink-0 ${s.ic}`} />
 <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
 </motion.div>
 );
 })}
 </div>
 )}
 </motion.div>

 {/* Budget recommendation breakdown */}
 {budgetEntries.length > 0 && (
 <motion.div {...fadeUp(5)} className="card">
 <div className="mb-5 flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 ">
 <Target size={18} className="text-brand-600 " />
 </div>
 <h3 className="text-base font-semibold text-gray-800 ">Recommended Budget Allocation</h3>
 </div>
 <div className="space-y-4">
 {budgetEntries
 .sort(([, a], [, b]) => b - a)
 .map(([cat, amount], i) => {
 const maxBudget = Math.max(...budgetEntries.map(([, v]) => v));
 const pct = maxBudget > 0 ? (amount / maxBudget) * 100 : 0;
 return (
 <div key={cat} className="group">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
 <ArrowRight size={14} className="text-brand-400 opacity-0 transition group-hover:opacity-100" />
 {cat}
 </span>
 <span className="text-sm font-bold text-gray-900 ">
 ₹{amount.toLocaleString("en-IN")}
 </span>
 </div>
 <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-200 ">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${pct}%` }}
 transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
 className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
 />
 </div>
 </div>
 );
 })}
 </div>
 </motion.div>
 )}

 {/* Financial tips */}
 <motion.div {...fadeUp(6)} className="card bg-gradient-to-br from-brand-50 to-purple-50 ">
 <h3 className="mb-4 text-base font-semibold text-gray-800 flex items-center gap-2">
 <Lightbulb size={18} className="text-brand-500" />
 Financial Tips
 </h3>
 <div className="grid gap-3 sm:grid-cols-2">
 {[
 { title: "50/30/20 Rule", desc: "Allocate 50% needs, 30% wants, 20% savings" },
 { title: "Emergency Fund", desc: "Build 3-6 months of core expenses as safety net" },
 { title: "Automate Savings", desc: "Set up auto-debit on salary day for investments" },
 { title: "Track Weekly", desc: "Review spending weekly to catch overspending early" },
 ].map((tip, i) => (
 <div key={tip.title} className="rounded-xl bg-white/60 p-4 ">
 <p className="text-sm font-semibold text-gray-800 ">{tip.title}</p>
 <p className="mt-1 text-xs text-gray-500 ">{tip.desc}</p>
 </div>
 ))}
 </div>
 </motion.div>
 </div>
 );
}
