import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, FileText, CheckCircle2 } from "lucide-react";
import FloatingInput from "../ui/FloatingInput";
import Button from "../ui/Button";

const CATEGORIES = ["Food", "Travel", "Bills", "Entertainment", "Healthcare", "Shopping", "Other"];

const CATEGORY_ICONS = {
  Food: "🍔", Travel: "✈️", Bills: "📄", Entertainment: "🎬",
  Healthcare: "💊", Shopping: "🛍️", Other: "📦",
};

export default function QuickActions({ expenseForm, setExpenseForm, onAddExpense, onUploadBill, uploading }) {
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onUploadBill({ target: { files: [file] } });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Add Expense */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/15">
            <Plus size={18} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Add Expense</h3>
        </div>

        <form onSubmit={onAddExpense} className="space-y-3">
          <label className="group relative block">
            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              className="peer w-full appearance-none rounded-xl border border-surface-300 bg-white/80 px-4 pb-2 pt-6 text-sm text-gray-800 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-surface-800 dark:bg-surface-900/80 dark:text-gray-200 dark:focus:border-brand-400 dark:focus:ring-brand-500/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c]} {c}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-gray-400 dark:text-gray-500">
              Category
            </span>
          </label>

          <FloatingInput
            label="Amount (₹)"
            type="number"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
            required
          />
          <FloatingInput
            label="Date"
            type="date"
            value={expenseForm.date}
            onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
            required
          />
          <FloatingInput
            label="Note (optional)"
            value={expenseForm.note}
            onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
          />

          <Button type="submit" className="w-full">
            <Plus size={16} />
            Save Expense
          </Button>
        </form>
      </motion.div>

      {/* Upload Bill */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card flex flex-col"
      >
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
            <Upload size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Upload Bill</h3>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300 ${
            dragOver
              ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
              : "border-surface-300 hover:border-brand-300 hover:bg-surface-100 dark:border-surface-800 dark:hover:border-brand-500/40 dark:hover:bg-surface-800/30"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="h-10 w-10 animate-spin text-brand-500" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Processing bill...</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-100 dark:bg-surface-800">
                <FileText size={28} className="text-gray-400" />
              </div>
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Drag & drop your receipt here
              </p>
              <p className="text-xs text-gray-400">
                Supports PNG, JPG, JPEG, PDF
              </p>
            </>
          )}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={onUploadBill}
            className="hidden"
          />
        </label>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Our AI automatically extracts amount, date, and category from your bills.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
