import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, ArrowUpRight, Wallet } from "lucide-react";
import api, { setAuthToken } from "./api";

import AuthForm from "./components/auth/AuthForm";
import DashboardLayout from "./components/layout/DashboardLayout";
import StatsOverview from "./components/dashboard/StatsOverview";
import QuickActions from "./components/dashboard/QuickActions";
import InsightsPanel from "./components/dashboard/InsightsPanel";
import ExpenseTable from "./components/dashboard/ExpenseTable";
import SpendingPieChart from "./components/charts/SpendingPieChart";
import TrendLineChart from "./components/charts/TrendLineChart";
import BudgetBarChart from "./components/charts/BudgetBarChart";
import ChatWidget from "./components/chat/ChatWidget";
import SalaryTracker from "./components/dashboard/SalaryTracker";
import AnalyticsPage from "./components/pages/AnalyticsPage";
import InsightsPage from "./components/pages/InsightsPage";
import NextMonthPage from "./components/pages/NextMonthPage";
import HistoryPage from "./components/pages/HistoryPage";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [activePage, setActivePage] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ category: "Food", amount: "", date: "", note: "" });
  const [uploading, setUploading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [dashLoading, setDashLoading] = useState(true);
  const [salary, setSalary] = useState(() => {
    const saved = localStorage.getItem("salary");
    return saved ? Number(saved) : 0;
  });

  function handleSalaryChange(val) {
    setSalary(val);
    localStorage.setItem("salary", String(val));
  }

  const pieData = useMemo(
    () => Object.entries(summary?.by_category || {}).map(([name, value]) => ({ name, value })),
    [summary]
  );
  const budgetData = useMemo(
    () => Object.entries(recommendation?.recommended_budget || {}).map(([category, budget]) => ({ category, budget })),
    [recommendation]
  );

  useEffect(() => {
    if (token) { setAuthToken(token); loadDashboard(); }
  }, [token]);

  async function loadDashboard() {
    try {
      setLoadError(""); setDashLoading(true);
      const [expRes, sumRes, recRes] = await Promise.all([
        api.get("/expenses"), api.get("/analytics/summary"), api.get("/recommendations"),
      ]);
      setExpenses(expRes.data); setSummary(sumRes.data); setRecommendation(recRes.data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Unable to connect to backend API");
    } finally { setDashLoading(false); }
  }

  function onAuth(t, u) {
    setToken(t); setUser(u); setAuthToken(t);
    localStorage.setItem("token", t); localStorage.setItem("user", JSON.stringify(u));
  }

  function handleLogout() {
    setToken(null); setUser(null); setAuthToken(null);
    localStorage.removeItem("token"); localStorage.removeItem("user");
  }

  async function addExpense(e) {
    e.preventDefault();
    await api.post("/expenses", { ...expenseForm, amount: Number(expenseForm.amount) });
    setExpenseForm({ category: "Food", amount: "", date: "", note: "" });
    await loadDashboard();
  }

  async function uploadBill(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append("bill", file);
    setUploading(true);
    try {
      const { data } = await api.post("/expenses/upload", fd);
      const count = data.transaction_count || 1;

      if (count > 1 && data.expenses) {
        // Bank statement — multiple transactions extracted
        const totalAmt = data.expenses.reduce((s, ex) => s + Number(ex.amount || 0), 0);
        const lines = data.expenses.map(
          (ex, i) => `${i + 1}. ${ex.note || "Transaction"} — ₹${Number(ex.amount).toLocaleString("en-IN")} [${ex.category}] (${ex.date})`
        ).join("\n");
        alert(
          `✅ Bank Statement Processed!\n\n` +
          `${count} transactions extracted\n` +
          `Total: ₹${totalAmt.toLocaleString("en-IN")}\n\n` +
          `${lines}`
        );
      } else {
        // Single bill
        const amt = data.expense?.amount;
        const cat = data.expense?.category || "Other";
        if (amt) {
          alert(`✅ Bill processed!\n\nExtracted Amount: ₹${Number(amt).toLocaleString("en-IN")}\nCategory: ${cat}\n\nThe expense has been added to your records.`);
        }
      }
      await loadDashboard();
    } catch (err) {
      alert(`❌ Failed to process bill: ${err.response?.data?.error || "Please try again."}`);
    } finally { setUploading(false); }
  }

  async function deleteExpense(expenseId) {
    try {
      await api.delete(`/expenses/${expenseId}`);
      await loadDashboard();
    } catch (err) {
      alert(`❌ Failed to delete: ${err.response?.data?.error || "Please try again."}`);
    }
  }

  async function deleteAllExpenses() {
    try {
      await api.delete("/expenses");
      await loadDashboard();
    } catch (err) {
      alert(`❌ Failed to delete all: ${err.response?.data?.error || "Please try again."}`);
    }
  }

  if (!token) return <AuthForm onAuth={onAuth} />;

  // Get today info for greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout user={user} onLogout={handleLogout} activePage={activePage} onPageChange={setActivePage}>
      <AnimatePresence mode="wait">
        {activePage === "dashboard" && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            {/* Hero header */}
            <div className="mb-8 pl-12 lg:pl-0">
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-brand-500 to-purple-600 p-6 sm:p-8 text-white shadow-lg">
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                    <CalendarDays size={14} />
                    <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {greeting}, {user?.name?.split(" ")[0] || "User"} 👋
                  </h1>
                  <p className="mt-1 text-sm text-white/80 max-w-lg">
                    Here's your financial snapshot. Track spending, review insights, and stay on top of your budget.
                  </p>
                  {summary && summary.total_spend > 0 && (
                    <div className="mt-4 flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Total Spent</p>
                        <p className="text-2xl font-extrabold">₹{summary.total_spend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Categories</p>
                        <p className="text-2xl font-extrabold">{pieData.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 uppercase tracking-wider">Transactions</p>
                        <p className="text-2xl font-extrabold">{expenses.length}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {loadError && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {loadError}
              </motion.div>
            )}

            <section className="mb-6">
              <StatsOverview summary={summary} recommendation={recommendation} loading={dashLoading} />
            </section>

            {/* Salary + Charts */}
            <section className="mb-6 grid gap-4 lg:grid-cols-3">
              <SalaryTracker salary={salary} onSalaryChange={handleSalaryChange} totalSpend={summary?.total_spend || 0} />
              <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
                <SpendingPieChart data={pieData} />
                <TrendLineChart data={summary?.monthly_trend || []} />
              </div>
            </section>

            <section className="mb-6">
              <BudgetBarChart data={budgetData} />
            </section>

            <section className="mb-6 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <QuickActions expenseForm={expenseForm} setExpenseForm={setExpenseForm}
                  onAddExpense={addExpense} onUploadBill={uploadBill} uploading={uploading} />
              </div>
              <InsightsPanel insights={recommendation?.insights || []} />
            </section>
          </motion.div>
        )}

        {activePage === "analytics" && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <AnalyticsPage summary={summary} recommendation={recommendation} expenses={expenses} />
          </motion.div>
        )}

        {activePage === "insights" && (
          <motion.div key="insights" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <InsightsPage recommendation={recommendation} summary={summary} />
          </motion.div>
        )}

        {activePage === "nextmonth" && (
          <motion.div key="nextmonth" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <NextMonthPage recommendation={recommendation} summary={summary} />
          </motion.div>
        )}

        {activePage === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
            <HistoryPage expenses={expenses} onDelete={deleteExpense} onDeleteAll={deleteAllExpenses} />
          </motion.div>
        )}
      </AnimatePresence>

      <ChatWidget />
    </DashboardLayout>
  );
}
