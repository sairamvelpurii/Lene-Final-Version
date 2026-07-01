import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white/95 px-4 py-3 shadow-card backdrop-blur-md dark:border-surface-800 dark:bg-surface-900/95">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-white">₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  );
}

export default function BudgetBarChart({ data = [] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">Budget Recommendations</h3>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 italic">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barCategoryGap="25%">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-surface-800" vertical={false} />
            <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
            <Bar dataKey="budget" fill="url(#barGrad)" radius={[8, 8, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
