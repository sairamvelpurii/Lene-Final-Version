import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

function CustomTooltip({ active, payload, label }) {
 if (!active || !payload?.length) return null;
 return (
 <div className="rounded-xl border border-surface-200 bg-white/95 px-4 py-3 shadow-card backdrop-blur-md ">
 <p className="text-xs text-gray-400 mb-2">{label}</p>
 {payload.map((entry, index) => (
 <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
 <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
 <p className="text-sm font-medium text-gray-700 ">
 {entry.name}: <span className="font-bold text-gray-900 ">₹{entry.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
 </p>
 </div>
 ))}
 </div>
 );
}

export default function WeeklyIncomeExpenseChart({ expenses = [], salary = 0 }) {
 // Initialize data array
 const data = [
 { name: "Week 1", Income: 0, Expense: 0 },
 { name: "Week 2", Income: 0, Expense: 0 },
 { name: "Week 3", Income: 0, Expense: 0 },
 { name: "Week 4", Income: 0, Expense: 0 },
 ];

 // If viewing a specific month, use all expenses (since they are pre-filtered).
 // If viewing "All Time", default to the current physical month for the weekly view.
 const now = new Date();
 const isAllTime = expenses.some(e => new Date(e.date).getMonth() !== new Date(expenses[0]?.date || now).getMonth());
 const targetMonth = isAllTime ? now.getMonth() : (expenses.length > 0 ? new Date(expenses[0].date).getMonth() : now.getMonth());
 const targetYear = isAllTime ? now.getFullYear() : (expenses.length > 0 ? new Date(expenses[0].date).getFullYear() : now.getFullYear());

 const currentMonthExpenses = expenses.filter(e => {
 const d = new Date(e.date);
 return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
 });

 currentMonthExpenses.forEach(e => {
 const day = new Date(e.date).getDate();
 let weekIndex = Math.floor((day - 1) / 7);
 if (weekIndex > 3) weekIndex = 3; // Put days 29-31 in Week 4
 
 if (e.type === "income") {
 data[weekIndex].Income += Number(e.amount || 0);
 } else {
 data[weekIndex].Expense += Number(e.amount || 0);
 }
 });

 // Distribute base salary evenly across the 4 weeks of the target month
 const weeklySalary = salary / 4;
 data.forEach(week => {
 week.Income += weeklySalary;
 });

 return (
 <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
 <h3 className="mb-4 text-base font-semibold text-gray-800 ">Income vs Expense</h3>
 <ResponsiveContainer width="100%" height={260}>
 <BarChart data={data} barCategoryGap="20%">
 <defs>
 <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
 <stop offset="100%" stopColor="#16a34a" stopOpacity={0.9} />
 </linearGradient>
 <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
 <stop offset="100%" stopColor="#dc2626" stopOpacity={0.9} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="" vertical={false} />
 <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dy={10} />
 <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} tickFormatter={(val) => `₹${val.toLocaleString("en-IN")}`} dx={-10} />
 <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(107, 114, 128, 0.05)" }} />
 <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />
 <Bar dataKey="Income" fill="url(#incomeGrad)" radius={[6, 6, 0, 0]} animationDuration={1000} barSize={24} />
 <Bar dataKey="Expense" fill="url(#expenseGrad)" radius={[6, 6, 0, 0]} animationDuration={1000} barSize={24} />
 </BarChart>
 </ResponsiveContainer>
 </motion.div>
 );
}
