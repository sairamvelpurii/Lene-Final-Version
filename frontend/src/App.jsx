import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api, { setAuthToken } from "./api";

import AuthForm from "./components/auth/AuthForm";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./components/pages/DashboardPage";
import UploadPage from "./components/pages/UploadPage";
import TransactionsPage from "./components/pages/TransactionsPage";
import AnalyticsPage from "./components/pages/AnalyticsPage";
import SettingsPage from "./components/pages/SettingsPage";
import ChatWidget from "./components/chat/ChatWidget";

export default function App() {
 const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
 const [activePage, setActivePage] = useState("dashboard");
 const [expenses, setExpenses] = useState([]);
 const [summary, setSummary] = useState(null);
 const [recommendation, setRecommendation] = useState(null);
 const [filterMonth, setFilterMonth] = useState("all");
 const [loadError, setLoadError] = useState("");
 const [dashLoading, setDashLoading] = useState(true);

 useEffect(() => {
 if (token) { setAuthToken(token); loadDashboard(); }
 }, [token, filterMonth]);

 async function loadDashboard() {
 try {
 setLoadError(""); setDashLoading(true);
 const [expRes, sumRes, recRes] = await Promise.all([
 api.get(`/expenses?month=${filterMonth}`), 
 api.get(`/analytics/summary?month=${filterMonth}`), 
 api.get("/recommendations"),
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

 async function deleteExpense(expenseId) {
 try {
 await api.delete(`/expenses/${expenseId}`);
 await loadDashboard();
 } catch (err) {
 alert(`Failed to delete: ${err.response?.data?.error || "Please try again."}`);
 }
 }

 if (!token) return <AuthForm onAuth={onAuth} />;

 return (
 <DashboardLayout user={user} onLogout={handleLogout} activePage={activePage} onPageChange={setActivePage}>
 {loadError && (
 <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
 className="mb-6 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-600">
 {loadError}
 </motion.div>
 )}

 <AnimatePresence mode="wait">
 {activePage === "dashboard" && (
 <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <div className="mb-8 flex items-center justify-between">
 <div>
 <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">Dashboard</h1>
 <p className="text-[15px] text-gray-500">Your money in ₹ — filtered period applies to all widgets.</p>
 </div>
 <div className="flex items-center gap-3">
 <select
 value={filterMonth}
 onChange={(e) => setFilterMonth(e.target.value)}
 className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-gray-700 outline-none hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
 >
 <option value="all">All Time</option>
 {summary?.monthly_trend?.map((m) => {
 const dateObj = new Date(m.month + "-01");
 return <option key={m.month} value={m.month}>{dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</option>;
 })}
 </select>
 </div>
 </div>
 <DashboardPage summary={summary} recommendation={recommendation} loading={dashLoading} expenses={expenses} />
 </motion.div>
 )}

 {activePage === "upload" && (
 <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <UploadPage onComplete={loadDashboard} onNavigate={setActivePage} />
 </motion.div>
 )}

 {activePage === "transactions" && (
 <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <TransactionsPage expenses={expenses} onDelete={deleteExpense} onReload={loadDashboard} />
 </motion.div>
 )}

 {activePage === "analytics" && (
 <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <AnalyticsPage summary={summary} expenses={expenses} />
 </motion.div>
 )}

 {activePage === "settings" && (
 <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
 <SettingsPage user={user} onLogout={handleLogout} />
 </motion.div>
 )}
 </AnimatePresence>
 <ChatWidget />
 </DashboardLayout>
 );
}
