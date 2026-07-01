import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Flame, Target, CalendarDays, BarChart3
} from "lucide-react";
import SpendingPieChart from "../charts/SpendingPieChart";
import TrendLineChart from "../charts/TrendLineChart";
import BudgetBarChart from "../charts/BudgetBarChart";

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4 },
});

export default function AnalyticsPage({ summary, recommendation, expenses }) {
  const pieData = useMemo(
    () => Object.entries(summary?.by_category || {}).map(([name, value]) => ({ name, value })),
    [summary]
  );
  const budgetData = useMemo(
    () => Object.entries(recommendation?.recommended_budget || {}).map(([category, budget]) => ({ category, budget })),
    [recommendation]
  );
  const highSpend = summary?.high_spend_categories || [];
  const totalSpend = summary?.total_spend || 0;
  const predicted = recommendation?.predicted_next_month_expense || 0;
  const trend = summary?.monthly_trend || [];
  const lastTwo = trend.slice(-2);
  const pctChange = lastTwo.length === 2 && lastTwo[0].amount > 0
    ? (((lastTwo[1].amount - lastTwo[0].amount) / lastTwo[0].amount) * 100).toFixed(1)
    : null;

  const topCategory = pieData.length > 0
    ? pieData.reduce((a, b) => (a.value > b.value ? a : b))
    : null;
  const topCatPct = topCategory && totalSpend > 0
    ? ((topCategory.value / totalSpend) * 100).toFixed(0)
    : 0;

  const avgMonthly = trend.length > 0
    ? (trend.reduce((s, t) => s + t.amount, 0) / trend.length).toFixed(0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="pl-12 lg:pl-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl flex items-center gap-3">
          <BarChart3 className="text-brand-500" size={28} />
          Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Deep dive into your spending patterns and financial health.
        </p>
      </motion.div>

      {/* Quick stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div {...fadeUp(1)} className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/15">
            <CalendarDays size={22} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg. Monthly</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{Number(avgMonthly).toLocaleString("en-IN")}</p>
          </div>
        </motion.div>

        <motion.div {...fadeUp(2)} className="card flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
            pctChange !== null && Number(pctChange) > 0
              ? "bg-red-100 dark:bg-red-500/15"
              : "bg-emerald-100 dark:bg-emerald-500/15"
          }`}>
            {pctChange !== null && Number(pctChange) > 0
              ? <TrendingUp size={22} className="text-red-600 dark:text-red-400" />
              : <TrendingDown size={22} className="text-emerald-600 dark:text-emerald-400" />
            }
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Month-over-Month</p>
            {pctChange !== null ? (
              <p className={`text-xl font-bold flex items-center gap-1 ${Number(pctChange) > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {Number(pctChange) > 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                {Math.abs(Number(pctChange))}%
              </p>
            ) : <p className="text-xl font-bold text-gray-400">—</p>}
          </div>
        </motion.div>

        <motion.div {...fadeUp(3)} className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/15">
            <Flame size={22} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Top Category</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {topCategory ? topCategory.name : "—"}
            </p>
            {topCategory && (
              <p className="text-xs text-gray-400">{topCatPct}% of total</p>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeUp(4)} className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-500/15">
            <Target size={22} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Predicted Next</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{Number(predicted).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SpendingPieChart data={pieData} />
        <TrendLineChart data={trend} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BudgetBarChart data={budgetData} />

        {/* High spend categories */}
        <motion.div {...fadeUp(6)} className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            High Spend Categories
          </h3>
          {highSpend.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 italic">No data yet</p>
          ) : (
            <div className="space-y-3">
              {pieData
                .filter((d) => highSpend.includes(d.name))
                .sort((a, b) => b.value - a.value)
                .map((cat, i) => {
                  const pct = totalSpend > 0 ? ((cat.value / totalSpend) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-200">{cat.name}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₹{cat.value.toLocaleString("en-IN")} <span className="text-xs text-gray-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-200 dark:bg-surface-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            Number(pct) > 40 ? "bg-red-500" : Number(pct) > 25 ? "bg-orange-500" : "bg-brand-500"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Expense by category table */}
      <motion.div {...fadeUp(7)} className="card">
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">Category Breakdown</h3>
        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-800/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 dark:border-surface-800/60 dark:bg-surface-800/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">% of Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Budget</th>
              </tr>
            </thead>
            <tbody>
              {pieData.sort((a, b) => b.value - a.value).map((cat) => {
                const pct = totalSpend > 0 ? ((cat.value / totalSpend) * 100).toFixed(1) : 0;
                const bud = budgetData.find((b) => b.category === cat.name);
                return (
                  <tr key={cat.name} className="border-b border-surface-100 transition-colors hover:bg-brand-50/50 dark:border-surface-800/40 dark:hover:bg-brand-500/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">{cat.name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">₹{cat.value.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{pct}%</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      {bud ? `₹${bud.budget.toLocaleString("en-IN")}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
