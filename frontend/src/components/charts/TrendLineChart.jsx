import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white/95 px-4 py-3 shadow-card backdrop-blur-md dark:border-surface-800 dark:bg-surface-900/95">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-white">₹{payload[0].value.toLocaleString("en-IN")}</p>
    </div>
  );
}

export default function TrendLineChart({ data = [] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card">
      <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">Monthly Trend</h3>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400 italic">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-surface-800" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="amount" stroke="#6366F1" strokeWidth={3} fill="url(#trendGrad)" animationDuration={1200} dot={{ fill: "#6366F1", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#4F46E5", stroke: "#fff", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
