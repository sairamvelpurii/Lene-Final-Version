import { useMemo } from "react";
import SpendingPieChart from "../charts/SpendingPieChart";
import TrendLineChart from "../charts/TrendLineChart";
import { formatCurrency } from "../../utils/formatters";

export default function AnalyticsPage({ summary, expenses }) {
  const pieData = useMemo(() => {
    return Object.entries(summary?.by_category || {}).map(([name, value]) => ({ name, value }));
  }, [summary]);

  const paymentData = useMemo(() => {
    const methods = expenses.reduce((acc, exp) => {
      if (exp.type === 'expense') {
        const pm = exp.paymentMode || "Unknown";
        acc[pm] = (acc[pm] || 0) + Number(exp.amount);
      }
      return acc;
    }, {});
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const trend = summary?.monthly_trend || [];
  const totalSpend = summary?.total_spend || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-[20px] font-semibold text-gray-900">Analytics</h2>
        <p className="text-[14px] text-gray-500">Deep dive into your spending patterns.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card flex flex-col min-h-[350px]">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-6">Category Breakdown</h3>
          <div className="flex-1 flex items-center justify-center">
            {pieData.length > 0 ? (
              <SpendingPieChart data={pieData} />
            ) : (
              <p className="text-[14px] text-gray-400">No data</p>
            )}
          </div>
        </div>

        <div className="card flex flex-col min-h-[350px]">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-6">Monthly Trend</h3>
          <div className="flex-1 flex items-center justify-center">
            {trend.length > 0 ? (
              <TrendLineChart data={trend} />
            ) : (
              <p className="text-[14px] text-gray-400">No data</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card flex flex-col min-h-[350px]">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-6">Payment Methods</h3>
          <div className="flex-1 flex items-center justify-center">
            {paymentData.length > 0 ? (
              <SpendingPieChart data={paymentData} />
            ) : (
              <p className="text-[14px] text-gray-400">No data</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-6">Detailed Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-500 uppercase text-right">Amount</th>
                  <th className="px-4 py-3 text-[12px] font-semibold text-gray-500 uppercase text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pieData.sort((a, b) => b.value - a.value).map(cat => {
                  const pct = totalSpend > 0 ? ((cat.value / totalSpend) * 100).toFixed(1) : 0;
                  return (
                    <tr key={cat.name} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-[14px] font-medium text-gray-700">{cat.name}</td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-gray-900 text-right">{formatCurrency(cat.value)}</td>
                      <td className="px-4 py-3 text-[14px] text-gray-500 text-right">{pct}%</td>
                    </tr>
                  );
                })}
                {pieData.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-[14px] text-gray-400">No category data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
