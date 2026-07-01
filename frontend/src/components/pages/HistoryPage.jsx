import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, AlertTriangle } from "lucide-react";

const CAT_COLORS = {
  Food: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  Travel: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  Bills: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  Healthcare: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Shopping: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
};

export default function HistoryPage({ expenses = [], onDelete, onDeleteAll }) {
  const [deletingId, setDeletingId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

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

  async function handleDeleteAll() {
    if (!onDeleteAll) return;
    setDeletingAll(true);
    try {
      await onDeleteAll();
    } finally {
      setDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
  }

  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="pl-12 lg:pl-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/15">
            <History size={22} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transaction History</h1>
            <p className="text-sm text-gray-400">{expenses.length} transactions • Total: ₹{totalAmount.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {expenses.length > 0 && (
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={deletingAll}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all
              hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20
              disabled:opacity-50 disabled:cursor-not-allowed">
            <Trash2 size={16} />
            Delete All History
          </button>
        )}
      </motion.div>

      {/* Delete All Confirmation Modal */}
      <AnimatePresence>
        {showDeleteAllConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteAllConfirm(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-900 dark:border dark:border-surface-800">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Delete All History</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
                Are you sure you want to permanently delete <strong>all {expenses.length} transactions</strong> (₹{totalAmount.toLocaleString("en-IN")})? 
                This will remove your entire expense history and reset all analytics.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                  {deletingAll ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Yes, Delete All
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        {expenses.length === 0 ? (
          <div className="py-16 text-center">
            <History size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No transaction history</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Your expenses will appear here once you start adding them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-800/60 dark:bg-surface-800/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Source</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Delete</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {expenses.map((exp, idx) => (
                    <motion.tr key={exp._id || `${exp.date}-${idx}`}
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -40, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="group border-b border-surface-100 transition-colors hover:bg-brand-50/50 dark:border-surface-800/40 dark:hover:bg-brand-500/5 last:border-0">
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{exp.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${CAT_COLORS[exp.category] || CAT_COLORS.Other}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">₹{Number(exp.amount).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{exp.note || "—"}</td>
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
    </div>
  );
}
