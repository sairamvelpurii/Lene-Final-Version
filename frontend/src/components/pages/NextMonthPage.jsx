import { useMemo } from "react";
import { motion } from "framer-motion";
import {
 CalendarCheck, Wallet, AlertTriangle, CheckCircle2,
 ShoppingCart, Utensils, Plane, Zap, Heart, Film, Package,
 ArrowDown, TrendingDown,
} from "lucide-react";

const CATEGORY_META = {
 Food: { icon: Utensils, color: "orange", emoji: "🍔" },
 Travel: { icon: Plane, color: "sky", emoji: "✈️" },
 Bills: { icon: Zap, color: "rose", emoji: "📄" },
 Entertainment: { icon: Film, color: "purple", emoji: "🎬" },
 Healthcare: { icon: Heart, color: "emerald", emoji: "💊" },
 Shopping: { icon: ShoppingCart, color: "pink", emoji: "🛍️" },
 Other: { icon: Package, color: "gray", emoji: "📦" },
};

const COLOR_MAP = {
 orange: { bg: "bg-orange-100 ", text: "text-orange-600 ", ring: "ring-orange-200 ", bar: "from-orange-500 to-orange-400" },
 sky: { bg: "bg-sky-100 ", text: "text-sky-600 ", ring: "ring-sky-200 ", bar: "from-sky-500 to-sky-400" },
 rose: { bg: "bg-rose-100 ", text: "text-rose-600 ", ring: "ring-rose-200 ", bar: "from-rose-500 to-rose-400" },
 purple: { bg: "bg-purple-100 ", text: "text-purple-600 ", ring: "ring-purple-200 ", bar: "from-purple-500 to-purple-400" },
 emerald: { bg: "bg-emerald-100 ", text: "text-emerald-600 ", ring: "ring-emerald-200 ", bar: "from-emerald-500 to-emerald-400" },
 pink: { bg: "bg-pink-100 ", text: "text-pink-600 ", ring: "ring-pink-200 ", bar: "from-pink-500 to-pink-400" },
 gray: { bg: "bg-gray-100 ", text: "text-gray-600 ", ring: "ring-gray-200 ", bar: "from-gray-500 to-gray-400" },
};

const fadeUp = (i = 0) => ({
 initial: { opacity: 0, y: 20 },
 animate: { opacity: 1, y: 0 },
 transition: { delay: i * 0.07, duration: 0.4 },
});

export default function NextMonthPage({ recommendation, summary }) {
 const predicted = recommendation?.predicted_next_month_expense || 0;
 const budgetEntries = Object.entries(recommendation?.recommended_budget || {});
 const totalBudget = budgetEntries.reduce((s, [, v]) => s + v, 0);
 const savings = recommendation?.suggested_savings || 0;
 const emergency = recommendation?.emergency_fund || 0;
 const totalSpend = summary?.total_spend || 0;
 const byCategory = summary?.by_category || {};

 // Build category plan with current spend vs recommended limit
 const categoryPlan = useMemo(() => {
 return budgetEntries
 .sort(([, a], [, b]) => b - a)
 .map(([cat, limit]) => {
 const currentSpend = byCategory[cat] || 0;
 const diff = currentSpend - limit;
 const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
 return { cat, limit, currentSpend, diff, meta };
 });
 }, [budgetEntries, byCategory]);

 // Categories not in budget but in spending
 const uncovered = useMemo(() => {
 const budgetCats = new Set(budgetEntries.map(([c]) => c));
 return Object.entries(byCategory)
 .filter(([c]) => !budgetCats.has(c))
 .map(([cat, spent]) => ({
 cat,
 spent,
 meta: CATEGORY_META[cat] || CATEGORY_META.Other,
 }));
 }, [budgetEntries, byCategory]);

 const hasData = predicted > 0 || budgetEntries.length > 0;

 const nextMonthName = new Date(
 new Date().getFullYear(),
 new Date().getMonth() + 1,
 1
 ).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

 return (
 <div className="space-y-6">
 {/* Header */}
 <motion.div {...fadeUp(0)} className="pl-12 lg:pl-0">
 <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl flex items-center gap-3">
 <CalendarCheck className="text-brand-500" size={28} />
 Next Month Plan
 </h1>
 <p className="mt-1 text-sm text-gray-500 ">
 Your AI-recommended spending limits for <span className="font-semibold text-gray-700 ">{nextMonthName}</span>.
 </p>
 </motion.div>

 {!hasData ? (
 <motion.div {...fadeUp(1)} className="card py-16 text-center">
 <CalendarCheck size={48} className="mx-auto mb-4 text-gray-300 " />
 <p className="text-lg font-semibold text-gray-500 ">No spending data yet</p>
 <p className="mt-1 text-sm text-gray-400">Add expenses for at least one month to get your personalized spending plan.</p>
 </motion.div>
 ) : (
 <>
 {/* Overview banner */}
 <motion.div {...fadeUp(1)}
 className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 p-6 sm:p-8 text-white shadow-lg">
 <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
 <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
 <div className="relative z-10">
 <p className="text-sm text-white/70 font-medium uppercase tracking-wider mb-1">
 Recommended Total Budget — {nextMonthName}
 </p>
 <p className="text-4xl sm:text-5xl font-extrabold">
 ₹{predicted.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
 </p>
 <div className="mt-4 flex flex-wrap gap-6 text-sm">
 <div>
 <p className="text-white/60 text-xs uppercase tracking-wider">Category Budget</p>
 <p className="text-lg font-bold">₹{totalBudget.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
 </div>
 <div>
 <p className="text-white/60 text-xs uppercase tracking-wider">Savings Target</p>
 <p className="text-lg font-bold">₹{savings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
 </div>
 <div>
 <p className="text-white/60 text-xs uppercase tracking-wider">Emergency Fund</p>
 <p className="text-lg font-bold">₹{emergency.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
 </div>
 </div>
 </div>
 </motion.div>

 {/* Category spending limits */}
 <motion.div {...fadeUp(2)}>
 <h2 className="mb-4 text-lg font-semibold text-gray-800 flex items-center gap-2">
 <Wallet size={20} className="text-brand-500" />
 Category-wise Spending Limits
 </h2>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {categoryPlan.map((item, i) => {
 const c = COLOR_MAP[item.meta.color] || COLOR_MAP.gray;
 const pctOfTotal = totalBudget > 0 ? ((item.limit / totalBudget) * 100).toFixed(0) : 0;
 const isOver = item.diff > 0;
 return (
 <motion.div
 key={item.cat}
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 + i * 0.08 }}
 whileHover={{ y: -4, transition: { duration: 0.2 } }}
 className={`card group ring-1 ${c.ring}`}
 >
 {/* Header */}
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} transition-transform group-hover:scale-110`}>
 <item.meta.icon size={20} className={c.text} />
 </div>
 <div>
 <p className="text-sm font-semibold text-gray-800 ">{item.cat}</p>
 <p className="text-xs text-gray-400">{pctOfTotal}% of budget</p>
 </div>
 </div>
 <span className="text-2xl">{item.meta.emoji}</span>
 </div>

 {/* Limit amount */}
 <div className="mb-3">
 <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
 Monthly Limit
 </p>
 <p className="text-2xl font-extrabold text-gray-900 ">
 ₹{item.limit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
 </p>
 </div>

 {/* Progress bar */}
 <div className="mb-3">
 <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-200 ">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${Math.min(100, Number(pctOfTotal))}%` }}
 transition={{ delay: 0.5 + i * 0.08, duration: 0.8, ease: "easeOut" }}
 className={`h-full rounded-full bg-gradient-to-r ${c.bar}`}
 />
 </div>
 </div>

 {/* Comparison with current */}
 {item.currentSpend > 0 && (
 <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
 isOver
 ? "bg-red-50 text-red-600 "
 : "bg-emerald-50 text-emerald-600 "
 }`}>
 {isOver ? (
 <>
 <AlertTriangle size={13} />
 Cut ₹{item.diff.toLocaleString("en-IN", { maximumFractionDigits: 0 })} vs current spending
 </>
 ) : (
 <>
 <CheckCircle2 size={13} />
 ₹{Math.abs(item.diff).toLocaleString("en-IN", { maximumFractionDigits: 0 })} under current spending
 </>
 )}
 </div>
 )}
 </motion.div>
 );
 })}
 </div>
 </motion.div>

 {/* Uncovered categories */}
 {uncovered.length > 0 && (
 <motion.div {...fadeUp(3)} className="card">
 <h3 className="mb-4 text-base font-semibold text-gray-800 flex items-center gap-2">
 <Package size={18} className="text-gray-400" />
 Other Spending (No Specific Limit Set)
 </h3>
 <div className="grid gap-3 sm:grid-cols-2">
 {uncovered.map((item) => {
 const c = COLOR_MAP[item.meta.color] || COLOR_MAP.gray;
 return (
 <div key={item.cat} className="flex items-center justify-between rounded-xl bg-surface-100 px-4 py-3 ">
 <div className="flex items-center gap-3">
 <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
 <item.meta.icon size={16} className={c.text} />
 </div>
 <span className="text-sm font-medium text-gray-700 ">{item.cat}</span>
 </div>
 <span className="text-sm font-semibold text-gray-500 ">
 ₹{item.spent.toLocaleString("en-IN")} spent
 </span>
 </div>
 );
 })}
 </div>
 </motion.div>
 )}

 {/* Tips section */}
 <motion.div {...fadeUp(4)}
 className="card bg-gradient-to-br from-emerald-50 to-teal-50 ">
 <h3 className="mb-4 text-base font-semibold text-gray-800 flex items-center gap-2">
 <TrendingDown size={18} className="text-emerald-500" />
 How to Stay Within Budget
 </h3>
 <div className="grid gap-3 sm:grid-cols-2">
 {[
 { title: "Set Weekly Limits", desc: "Divide monthly budget by 4 — track weekly to catch overspending early" },
 { title: "Use Cash for Discretionary", desc: "Withdraw fixed cash for Food, Shopping — when it's gone, stop spending" },
 { title: "Cook More at Home", desc: "Reduce food expenses by 30-40% by meal prepping on weekends" },
 { title: "Review Subscriptions", desc: "Cancel unused subscriptions — check Entertainment & Bills categories" },
 { title: "48-Hour Rule", desc: "Wait 48 hours before any purchase over ₹2,000 — avoid impulse buys" },
 { title: "Automate Savings First", desc: "Transfer savings on salary day before spending anything" },
 ].map((tip) => (
 <div key={tip.title} className="rounded-xl bg-white/60 p-4 ">
 <p className="text-sm font-semibold text-gray-800 ">{tip.title}</p>
 <p className="mt-1 text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
 </div>
 ))}
 </div>
 </motion.div>
 </>
 )}
 </div>
 );
}
