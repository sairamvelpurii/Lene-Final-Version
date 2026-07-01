import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Trash2 } from "lucide-react";

const CAT_COLORS = {
  Food: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  Travel: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  Bills: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  Healthcare: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Shopping: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
};

export default function ExpenseTable({ expenses = [], onDelete }) {
  const [deletingId, setDeletingId] = useState(null);
  const visible = expenses.slice(0, 10);

  async function handleDelete(expenseId) {
    if (!onDelete) return;
    const confirmed = window.confirm("Are you sure you want to delete this transaction?");
    if (!confirmed) return;
    setDeletingId(expenseId);
    try {
      await onDelete(expenseId);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/15">
          <Receipt size={18} className="text-brand-600 dark:text-brand-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">Recent Expenses</h3>
        <span className="ml-auto text-xs text-gray-400">{expenses.length} total</span>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 italic">No expenses yet. Add your first expense above!</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-800/60 dark:bg-surface-800/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Source</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {visible.map((exp, idx) => (
                  <motion.tr key={exp._id || `${exp.date}-${idx}`}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -40, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="group border-b border-surface-100 transition-colors hover:bg-brand-50/50 dark:border-surface-800/40 dark:hover:bg-brand-500/5 last:border-0">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{exp.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${CAT_COLORS[exp.category] || CAT_COLORS.Other}`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">₹{Number(exp.amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        exp.source === "bill_upload" ? "text-emerald-600 dark:text-emerald-400"
                        : exp.source === "bank_statement" ? "text-purple-600 dark:text-purple-400"
                        : "text-gray-400"
                      }`}>
                        {exp.source === "bill_upload" ? "📄 Bill" : exp.source === "bank_statement" ? "🏦 Statement" : "✏️ Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(exp._id)}
                        disabled={deletingId === exp._id || !exp._id}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 transition-all
                          hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                          disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete transaction">
                        {deletingId === exp._id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
