import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../../utils/formatters";

const COLORS = ["#34D399", "#F97316", "#A78BFA", "#38BDF8", "#FBBF24", "#F87171", "#E879F9"];

function CustomTooltip({ active, payload }) {
 if (!active || !payload?.length) return null;
 return (
 <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
 <p className="text-sm font-semibold text-gray-800">{payload[0].name}</p>
 <p className="text-sm text-gray-500">{formatCurrency(payload[0].value)}</p>
 </div>
 );
}

export default function SpendingPieChart({ data = [] }) {
 const total = data.reduce((s, d) => s + d.value, 0);
 if (data.length === 0) {
 return <p className="py-12 text-center text-sm text-gray-400 italic">No data yet</p>;
 }
 return (
 <div className="flex flex-col items-center sm:flex-row sm:gap-6 w-full">
 <ResponsiveContainer width="100%" height={240} className="sm:max-w-[240px]">
 <PieChart>
 <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} animationDuration={700} strokeWidth={0}>
 {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
 </Pie>
 <Tooltip content={<CustomTooltip />} />
 <text x="50%" y="48%" textAnchor="middle" className="text-xl font-bold fill-gray-800">{formatCurrency(total)}</text>
 <text x="50%" y="58%" textAnchor="middle" className="text-xs fill-gray-400">Total</text>
 </PieChart>
 </ResponsiveContainer>
 <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:flex-1">
 {data.map((d, i) => (
 <div key={d.name} className="flex items-center gap-2 min-w-0">
 <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
 <div className="min-w-0">
 <p className="text-xs text-gray-500 truncate">{d.name}</p>
 <p className="text-xs font-semibold text-gray-700">{formatCurrency(d.value)}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
