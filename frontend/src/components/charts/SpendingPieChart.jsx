import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#6366F1", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white/95 px-4 py-3 shadow-card backdrop-blur-md dark:border-surface-800 dark:bg-surface-900/95">
      <p className="text-sm font-semibold text-gray-800 dark:text-white">{payload[0].name}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  );
}

export default function SpendingPieChart({ data = [] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">Spending Breakdown</h3>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 italic">No data yet</p>
      ) : (
        <div className="flex flex-col items-center sm:flex-row sm:gap-6">
          <ResponsiveContainer width="100%" height={240} className="sm:max-w-[240px]">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} animationDuration={900} strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <text x="50%" y="48%" textAnchor="middle" className="text-2xl font-bold fill-gray-800 dark:fill-white">₹{total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</text>
              <text x="50%" y="58%" textAnchor="middle" className="text-xs fill-gray-400">Total</text>
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:flex-1">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{d.name}</p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">₹{d.value.toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
