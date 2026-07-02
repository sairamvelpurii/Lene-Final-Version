import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import { formatCurrency } from "../../utils/formatters";
import { MessageCircle, TrendingUp, ArrowUp, ArrowDown, Calendar } from "lucide-react";

const PIE_COLORS = ["#34D399", "#F97316", "#A78BFA", "#38BDF8", "#FBBF24", "#F87171", "#E879F9"];
const WEEK_BADGE = ["#34D399", "#FBBF24", "#FB923C", "#F87171"];

/* muted, non-vibrant, clearly distinct background colours for each spending range */
const RANGE_STYLES = [
  { bg: "#D1FAE5", text: "#065F46" },   /* Under ₹500  – soft mint   */
  { bg: "#FEF3C7", text: "#92400E" },   /* ₹500–1k     – soft amber  */
  { bg: "#DBEAFE", text: "#1E40AF" },   /* ₹1k–3k      – soft blue   */
  { bg: "#EDE9FE", text: "#5B21B6" },   /* ₹3k–10k     – soft violet */
  { bg: "#FCE7F3", text: "#9D174D" },   /* Over ₹10k   – soft pink   */
];

/* Custom tooltip for recharts */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg text-[13px]">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

export default function DashboardPage({ summary, recommendation, loading, expenses }) {
  const [pieTab, setPieTab] = useState("monthly");
  const [showAllCats, setShowAllCats] = useState(false);

  /* reset "show all" when switching tabs so it doesn't carry over */
  function handleTabChange(tab) {
    setPieTab(tab);
    setShowAllCats(false);
  }


  const moneyIn  = summary?.total_income || 0;
  const moneyOut = summary?.total_spend  || 0;
  const saved    = moneyIn - moneyOut;

  /* ── Pie: full-month data from backend ── */
  const allPieData = useMemo(() =>
    Object.entries(summary?.by_category || {})
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
  [summary]);

  /* ── Pie: per-week buckets computed from raw expenses ── */
  const weeklyPieData = useMemo(() => {
    const buckets = [{}, {}, {}, {}];
    (expenses || []).filter(e => e.type === "expense").forEach(exp => {
      const day = new Date(exp.date).getDate();
      let wi = Math.min(Math.floor((day - 1) / 7), 3);
      if (isNaN(wi) || wi < 0) wi = 0;
      const cat = exp.category || "Other";
      buckets[wi][cat] = (buckets[wi][cat] || 0) + Number(exp.amount);
    });
    return buckets.map(b =>
      Object.entries(b)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    );
  }, [expenses]);

  const currentPie = pieTab === "monthly" ? allPieData : (weeklyPieData[Number(pieTab)] || []);
  const pieTotal   = currentPie.reduce((s, d) => s + d.value, 0);
  const topCat     = currentPie.length > 0 ? currentPie[0] : null;          /* already sorted desc */
  const topCatPct  = topCat && pieTotal > 0 ? ((topCat.value / pieTotal) * 100).toFixed(0) : 0;

  /* ── Weekly bar-chart data (income + expense per week) ── */
  const weeklyBarData = useMemo(() => {
    const weeks = [{ income: 0, expense: 0 }, { income: 0, expense: 0 }, { income: 0, expense: 0 }, { income: 0, expense: 0 }];
    (expenses || []).forEach(exp => {
      const day = new Date(exp.date).getDate();
      let wi = Math.min(Math.floor((day - 1) / 7), 3);
      if (isNaN(wi) || wi < 0) wi = 0;
      const amt = Number(exp.amount) || 0;
      if (exp.type === "income") weeks[wi].income += amt;
      else                       weeks[wi].expense += amt;
    });
    return weeks.map((w, i) => ({ name: `Week ${i + 1}`, Income: w.income, Expense: w.expense }));
  }, [expenses]);

  /* ── Weekly insights ── */
  const weeklyInsights = useMemo(() => {
    const catsByWeek = [{}, {}, {}, {}];
    const totals     = [0, 0, 0, 0];
    (expenses || []).filter(e => e.type === "expense").forEach(exp => {
      const day = new Date(exp.date).getDate();
      let wi = Math.min(Math.floor((day - 1) / 7), 3);
      if (isNaN(wi) || wi < 0) wi = 0;
      const cat = exp.category || "Other";
      const amt = Number(exp.amount) || 0;
      catsByWeek[wi][cat] = (catsByWeek[wi][cat] || 0) + amt;
      totals[wi] += amt;
    });
    return totals.map((total, i) => {
      const cats   = Object.entries(catsByWeek[i]).sort((a, b) => b[1] - a[1]);
      const topCat = cats.length > 0 ? cats[0][0] : "—";
      const prev   = i > 0 ? totals[i - 1] : 0;
      let insight  = total === 0 ? "No spending logged yet." : `Steady week. Top category: ${topCat}.`;
      if (i > 0 && prev > 0 && total > prev * 1.3) insight = `⚡ Spending jumped vs last week! Watch out for ${topCat}.`;
      else if (i > 0 && prev > 0 && total < prev * 0.7) insight = `✨ Great control! Spending dropped. Top: ${topCat}.`;
      return { week: i + 1, total, topCat, insight };
    });
  }, [expenses]);

  /* ── Spending behaviour ── */
  const spendingBehavior = useMemo(() => {
    const dayTotals = {};
    (expenses || []).filter(e => e.type === "expense").forEach(exp => {
      const dateStr = (exp.date || "").split("T")[0];
      if (!dateStr) return;
      dayTotals[dateStr] = (dayTotals[dateStr] || 0) + (Number(exp.amount) || 0);
    });
    const entries = Object.entries(dayTotals);
    if (entries.length === 0) return null;
    const sorted  = [...entries].sort((a, b) => b[1] - a[1]);
    const highest = sorted[0];
    const lowest  = sorted[sorted.length - 1];

    const ranges = [
      { label: "Under ₹500",       min: 0,     max: 500,      days: [] },
      { label: "₹500 – ₹1,000",    min: 500,   max: 1000,     days: [] },
      { label: "₹1,000 – ₹3,000",  min: 1000,  max: 3000,     days: [] },
      { label: "₹3,000 – ₹10,000", min: 3000,  max: 10000,    days: [] },
      { label: "Over ₹10,000",     min: 10000, max: Infinity,  days: [] },
    ];
    entries.forEach(([date, amount]) => {
      for (const r of ranges) { if (amount >= r.min && amount < r.max) { r.days.push(date); break; } }
    });
    return { highest, lowest, ranges };
  }, [expenses]);

  /* ── LENE Says ── */
  const leneSays = useMemo(() => {
    const lines = [];
    const cats = Object.entries(summary?.by_category || {}).sort((a, b) => b[1] - a[1]);
    if (cats.length > 0) {
      const topName = cats[0][0];
      const allCatNames = cats.slice(0, 2).map(c => c[0]).join(" and ");
      lines.push(`You spent most of your money on ${allCatNames}.`);
    }
    if (moneyOut > moneyIn && moneyIn > 0) {
      lines.push(`You spent more than you earned this month. Review your expenses.`);
    } else if (saved > 0) {
      lines.push(`You saved ${formatCurrency(saved)} — keep it up!`);
    } else if (moneyIn === 0 && moneyOut === 0) {
      lines.push("Add transactions to start seeing insights.");
    }
    return lines.length > 0 ? lines : ["Add more transactions to see richer insights."];
  }, [summary, moneyIn, moneyOut, saved]);

  /* helper */
  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" }); } catch { return d; } };

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0,1,2].map(i => <div key={i} className="h-28 rounded-[20px] bg-gray-100 animate-pulse" />)}
        </div>
        <div className="h-24 rounded-[20px] bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0,1].map(i => <div key={i} className="h-96 rounded-[20px] bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-10">

      {/* ════ 1. SUMMARY CARDS ════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
            <TrendingUp className="text-emerald-600" size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">Credited</p>
            <p className="text-[26px] font-bold text-gray-900">{formatCurrency(moneyIn)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100">
            <ArrowUp className="text-orange-500" size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">Debited</p>
            <p className="text-[26px] font-bold text-gray-900">{formatCurrency(moneyOut)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100">
            <ArrowDown className="text-violet-500" size={22} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">Savings</p>
            <p className={`text-[26px] font-bold ${saved >= 0 ? "text-gray-900" : "text-red-600"}`}>{formatCurrency(saved)}</p>
          </div>
        </div>
      </div>

      {/* ════ 2. LENE SAYS ════ */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="text-emerald-500" size={18} />
          <h3 className="text-[15px] font-bold text-gray-900">LENE Says</h3>
        </div>
        {leneSays.map((line, i) => (
          <p key={i} className="text-[14px] text-gray-600 leading-relaxed mb-1 last:mb-0">{line}</p>
        ))}
      </div>

      {/* ════ 3. PIE + WEEKLY BAR ════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Where your money goes – with week tabs */}
        <div className="card min-h-[440px]">
          <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Where Your Money Goes</h3>
          <p className="text-[13px] text-gray-400 mb-4">
            {pieTab === "monthly" ? "Full month breakdown" : `Week ${Number(pieTab) + 1} breakdown`}
          </p>

          <div className="flex gap-2 mb-6 flex-wrap">
            {["monthly","0","1","2","3"].map(tab => (
              <button key={tab} onClick={() => handleTabChange(tab)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                  pieTab === tab ? "bg-emerald-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {tab === "monthly" ? "Monthly" : `Week ${Number(tab) + 1}`}
              </button>
            ))}
          </div>

          {currentPie.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-[200px] h-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentPie} dataKey="value" nameKey="name"
                        innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0}
                        animationDuration={500} animationBegin={0}>
                        {currentPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                      <text x="50%" y="46%" textAnchor="middle" className="text-lg font-bold fill-gray-800">{formatCurrency(pieTotal).replace("₹", "₹")}</text>
                      <text x="50%" y="57%" textAnchor="middle" className="text-[11px] fill-gray-400">Total</text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 grid grid-cols-1 gap-y-2.5 w-full">
                  {(showAllCats ? currentPie : currentPie.slice(0, 3)).map((d, i) => {
                    const pct = pieTotal > 0 ? ((d.value / pieTotal) * 100).toFixed(0) : 0;
                    const color = PIE_COLORS[i % PIE_COLORS.length];
                    return (
                      <div key={d.name} className="flex items-center gap-2.5">
                        <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[13px] text-gray-600 min-w-[60px]">{d.name}</span>
                        <span className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </span>
                        <span className="text-[12px] text-gray-500 w-8 text-right">{pct}%</span>
                        <span className="text-[12px] font-semibold text-gray-800 w-20 text-right">{formatCurrency(d.value)}</span>
                      </div>
                    );
                  })}
                  {currentPie.length > 3 && (
                    <button onClick={() => setShowAllCats(v => !v)} className="text-[12px] text-emerald-600 font-medium hover:underline mt-1">
                      {showAllCats ? "Show less ▲" : `Show ${currentPie.length - 3} more categories ▼`}
                    </button>
                  )}
                </div>
              </div>

              {topCat && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-[13px] text-gray-600">
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: PIE_COLORS[0] }} />
                    <strong>{topCat.name}</strong> is your top spend — {topCatPct}% of {pieTab === "monthly" ? "full month" : `Week ${Number(pieTab) + 1}`} expenses ({formatCurrency(topCat.value)}).
                    {Number(topCatPct) > 40 ? " That's a big chunk — consider if you can reduce it." : " Looks reasonable."}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-[14px] text-gray-400 text-center py-16">No spending data for this period.</p>
          )}
        </div>

        {/* Weekly Spending bar chart */}
        <div className="card min-h-[440px]">
          <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Weekly Spending</h3>
          <p className="text-[13px] text-gray-400 mb-6">Income vs Expense per week</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyBarData} barGap={4} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#9CA3AF" }} tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar dataKey="Expense" fill="#F87171" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={800} />
              <Bar dataKey="Income"  fill="#34D399" radius={[6, 6, 0, 0]} maxBarSize={36} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ════ 4. WEEKLY INSIGHTS + SPENDING BEHAVIOR ════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weekly Insights */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="text-gray-400" size={18} />
            <h3 className="text-[16px] font-semibold text-gray-900">Weekly Insights</h3>
          </div>
          <div className="space-y-3">
            {weeklyInsights.map((w, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <span className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold text-white"
                  style={{ backgroundColor: WEEK_BADGE[i] }}>
                  Week {w.week}
                </span>
                <span className="text-[13px] text-gray-500 flex-1 leading-snug">{w.insight}</span>
                <div className="text-right shrink-0">
                  <span className="text-[13px] font-semibold text-gray-800">{formatCurrency(w.total)}</span>
                  <br/><span className="text-[11px] text-gray-400">spent</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spending Behavior */}
        <div className="card">
          <h3 className="text-[16px] font-semibold text-gray-900 mb-5">Your Spending Behavior</h3>
          {spendingBehavior ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <ArrowUp className="text-red-400" size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase">Spent the most on</p>
                    <p className="text-[14px] font-semibold text-gray-900">{fmtDate(spendingBehavior.highest[0])} — {formatCurrency(spendingBehavior.highest[1])}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <ArrowDown className="text-emerald-400" size={16} />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium uppercase">Lowest spending day</p>
                    <p className="text-[14px] font-semibold text-gray-900">{fmtDate(spendingBehavior.lowest[0])} — {formatCurrency(spendingBehavior.lowest[1])}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[12px] text-gray-400 font-medium mb-3 flex items-center gap-1.5">
                  <Calendar size={13} /> Days grouped by spending amount
                </p>
                <div className="space-y-3">
                  {spendingBehavior.ranges.map((range, i) => {
                    if (range.days.length === 0) return null;
                    const style = RANGE_STYLES[i] || RANGE_STYLES[0];
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md"
                            style={{ backgroundColor: style.bg, color: style.text }}>
                            {range.label}
                          </span>
                          <span className="text-[12px] text-gray-400 font-medium">
                            {range.days.length} day{range.days.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {range.days.map(d => (
                            <span key={d} className="text-[11px] px-2 py-1 rounded-md"
                              style={{ backgroundColor: style.bg, color: style.text }}>
                              {fmtDate(d)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-gray-400 text-center py-8">Not enough data for behavior analysis.</p>
          )}
        </div>
      </div>

    </div>
  );
}
