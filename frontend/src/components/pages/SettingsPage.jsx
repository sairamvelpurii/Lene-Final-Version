import { useState } from "react";
import { User, DollarSign, Download, Trash2, Save, CreditCard } from "lucide-react";

export default function SettingsPage({ user, onLogout }) {
  const [budget, setBudget] = useState(localStorage.getItem("budget") || "10000");
  const [currency, setCurrency] = useState("INR");

  function handleSave() {
    localStorage.setItem("budget", budget);
    alert("Settings saved successfully!");
  }

  function handleExport() {
    alert("Exporting data as CSV...");
    // Mock export
  }

  function handleDeleteAccount() {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      alert("Account deleted.");
      onLogout();
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-[20px] font-semibold text-gray-900 mb-6">Settings</h2>

      {/* Profile Section */}
      <div className="card space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="text-emerald-600" size={20} />
          <h3 className="text-[16px] font-semibold text-gray-900">User Profile</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-[16px] font-semibold text-gray-900">{user?.name || "User"}</p>
            <p className="text-[14px] text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="card space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="text-emerald-600" size={20} />
          <h3 className="text-[16px] font-semibold text-gray-900">Preferences</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-1.5">Currency</label>
            <select 
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[15px] outline-none focus:border-emerald-500 bg-white"
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-1.5">Monthly Budget Limit</label>
            <div className="relative">
              <input 
                type="number" 
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full rounded-[12px] border border-gray-200 pl-10 pr-4 py-2.5 text-[15px] outline-none focus:border-emerald-500" 
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <button onClick={handleSave} className="flex items-center gap-2 rounded-[12px] bg-emerald-500 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-emerald-600 transition-colors">
            <Save size={16} /> Save Preferences
          </button>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="card space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="text-emerald-600" size={20} />
          <h3 className="text-[16px] font-semibold text-gray-900">Data & Privacy</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleExport} className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-gray-200 bg-white px-5 py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} /> Export Data
          </button>
          
          <button onClick={handleDeleteAccount} className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-red-200 bg-red-50 px-5 py-2.5 text-[14px] font-medium text-red-600 hover:bg-red-100 transition-colors">
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
