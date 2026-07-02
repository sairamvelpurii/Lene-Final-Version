import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";
import { formatCurrency } from "../../utils/formatters";

function CustomTooltip({ active, payload, label }) {
 if (!active || !payload?.length) return null;
 return (
 <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
 <p className="text-xs text-gray-400 mb-1">{label}</p>
 <p className="text-sm font-semibold text-gray-800">{formatCurrency(payload[0].value)}</p>
 </div>
 );
}

export default function TrendLineChart({ data = [] }) {
 if (data.length === 0) {
 return <p className="py-12 text-center text-sm text-gray-400 italic">No data yet</p>;
 }
 return (
 <ResponsiveContainer width="100%" height={260}>
 <AreaChart data={data}>
 <defs>
 <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#34D399" stopOpacity={0.25} />
 <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
 <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
 <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
 <Tooltip content={<CustomTooltip />} />
 <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} fill="url(#trendGrad)" animationDuration={1000}
 dot={{ fill: "#10B981", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "#059669", stroke: "#fff", strokeWidth: 2 }} />
 </AreaChart>
 </ResponsiveContainer>
 );
}
