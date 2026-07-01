import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee, PiggyBank, ShieldCheck, Wallet,
  TrendingDown, Edit3, Check, X, AlertCircle,
} from "lucide-react";

export default function SalaryTracker({ salary, onSalaryChange, totalSpend }) {
  const [editing, setEditing] = useState(!salary);
  const [draft, setDraft] = useState(salary || "");

  const sal = salary || 0;
  const emergencyPct = 0.10;
  const savingsPct = 0.20;
  const emergencyAmt = Math.round(sal * emergencyPct);
  const savingsAmt = Math.round(sal * savingsPct);
  const spent = totalSpend || 0;
  const remaining = sal - spent - emergencyAmt - savingsAmt;
  const spentPct = sal > 0 ? Math.min(100, (spent / sal) * 100) : 0;
  const isOverBudget = remaining < 0;

  function save() {
    const val = Number(draft);
    if (val > 0) {
      onSalaryChange(val);
      setEditing(false);
    }
  }

  const segments = sal > 0 ? [
    { label: "Spent",     amount: spent,        pct: (spent / sal) * 100,        color: "bg-brand-500" },
    { label: "Savings",   amount: savingsAmt,   pct: (savingsAmt / sal) * 100,   color: "bg-emerald-500" },
    { label: "Emergency", amount: emergencyAmt, pct: (emergencyAmt / sal) * 100, color: "bg-amber-500" },
    { label: "Remaining", amount: Math.max(0, remaining), pct: Math.max(0, remaining / sal) * 100, color: "bg-gray-300 dark:bg-gray-600" },
  ] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="card relative overflow-hidden"
    >
      {/* Decorative accent */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-100/50 blur-2xl dark:bg-brand-500/10" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 shadow-sm">
              <IndianRupee size={18} className="text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Monthly Salary</h3>
          </div>
          {salary > 0 && !editing && (
            <button onClick={() => { setDraft(salary); setEditing(true); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10">
              <Edit3 size={13} /> Edit
            </button>
          )}
        </div>

        {/* Salary input */}
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-5">
              <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                Enter your monthly take-home salary
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₹</span>
                  <input
                    type="number"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && save()}
                    placeholder="e.g. 50000"
                    autoFocus
                    className="w-full rounded-xl border border-surface-300 bg-white/80 py-2.5 pl-8 pr-3 text-sm font-semibold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-surface-800 dark:bg-surface-900/80 dark:text-white dark:focus:ring-brand-500/20"
                  />
                </div>
                <button onClick={save}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition hover:bg-brand-700">
                  <Check size={18} />
                </button>
                {salary > 0 && (
                  <button onClick={() => setEditing(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-300 text-gray-400 transition hover:text-gray-600 dark:border-surface-800 dark:hover:text-gray-200">
                    <X size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="display" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Salary amount */}
              <p className="mb-1 text-3xl font-extrabold text-gray-900 dark:text-white">
                ₹{sal.toLocaleString("en-IN")}
                <span className="ml-2 text-sm font-medium text-gray-400">/month</span>
              </p>

              {/* Progress bar — stacked segments */}
              <div className="mt-4 mb-4">
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800 flex">
                  {segments.map((seg) => (
                    <motion.div
                      key={seg.label}
                      initial={{ width: 0 }}
                      animate={{ width: `${seg.pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full first:rounded-l-full last:rounded-r-full ${seg.color}`}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {segments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${seg.color}`} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{seg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-50 px-3 py-3 dark:bg-brand-500/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Wallet size={14} className="text-brand-500" />
                    <span className="text-xs font-medium text-brand-600 dark:text-brand-400">Spent</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ₹{spent.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">{spentPct.toFixed(0)}% of salary</p>
                </div>

                <div className="rounded-xl bg-emerald-50 px-3 py-3 dark:bg-emerald-500/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <PiggyBank size={14} className="text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Savings (20%)</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ₹{savingsAmt.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">Auto-allocated</p>
                </div>

                <div className="rounded-xl bg-amber-50 px-3 py-3 dark:bg-amber-500/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={14} className="text-amber-500" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Emergency (10%)</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ₹{emergencyAmt.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">Safety fund</p>
                </div>

                <div className={`rounded-xl px-3 py-3 ${
                  isOverBudget
                    ? "bg-red-50 dark:bg-red-500/10"
                    : "bg-surface-100 dark:bg-surface-800/40"
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {isOverBudget
                      ? <AlertCircle size={14} className="text-red-500" />
                      : <TrendingDown size={14} className="text-gray-500 dark:text-gray-400" />
                    }
                    <span className={`text-xs font-medium ${
                      isOverBudget ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
                    }`}>
                      {isOverBudget ? "Over Budget!" : "Remaining"}
                    </span>
                  </div>
                  <p className={`text-lg font-bold ${
                    isOverBudget ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"
                  }`}>
                    {isOverBudget ? "-" : ""}₹{Math.abs(remaining).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isOverBudget ? "Exceeded budget" : "Available to spend"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
