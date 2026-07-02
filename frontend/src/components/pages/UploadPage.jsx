import { useState } from "react";
import { UploadCloud, Calendar, IndianRupee, Tag, Info, FileText } from "lucide-react";
import api from "../../api";

export default function UploadPage({ onComplete, onNavigate }) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // This state holds the form data, whether manual or from OCR
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    note: "",
    type: "expense",
    category: "Other",
    merchant: "",
    paymentMode: "Unknown",
    confidenceScore: 0,
    receiptImage: "",
    ocrText: "",
    items: [],
  });

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("bill", file);
    setUploading(true);

    try {
      const { data } = await api.post("/expenses/upload", fd);
      
      // We expect the backend to return `expenses` array and `file_path`.
      // We take the first expense to prefill the form.
      if (data.expenses && data.expenses.length > 0) {
        const parsed = data.expenses[0];
        setForm({
          date: parsed.date || new Date().toISOString().split("T")[0],
          amount: parsed.amount || "",
          note: parsed.merchant || parsed.description || "",
          type: parsed.type || "expense",
          category: parsed.category || "Other",
          merchant: parsed.merchant || "",
          paymentMode: parsed.paymentMode || "Unknown",
          confidenceScore: parsed.confidenceScore || 0,
          receiptImage: data.file_path || "",
          ocrText: data.ocr_text || "",
          items: parsed.items || [],
        });
        alert(`✅ OCR Success!\n\nExtracted Amount: ₹${parsed.amount}\nPlease review the fields below and save.`);
      }
    } catch (err) {
      alert(`❌ OCR Failed: ${err.response?.data?.error || "Please try again."}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    
    setSaving(true);
    try {
      await api.post("/expenses", { 
        ...form, 
        amount: Number(form.amount),
        source: form.receiptImage ? "ocr" : "manual"
      });
      alert("✅ Transaction saved successfully!");
      onComplete(); // refresh data
      onNavigate("dashboard"); // go to dashboard
    } catch (err) {
      alert(`❌ Failed to save: ${err.response?.data?.error || "Please try again."}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* File Import Section */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <UploadCloud className="text-emerald-600" size={20} />
          <h2 className="text-[16px] font-semibold text-gray-900">File import</h2>
        </div>
        <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
          Supports PDF, CSV, and Excel in Indian rupees (₹). For the most accurate results, use the statement download your bank provides.
        </p>

        <div className="relative rounded-[16px] border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors p-10 text-center flex flex-col items-center justify-center cursor-pointer">
          <input 
            type="file" 
            accept="image/*,.pdf" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading ? (
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[14px] font-medium text-emerald-600">Extracting data with AI...</p>
            </div>
          ) : (
            <>
              <FileText className="text-gray-400 mb-3" size={32} />
              <p className="text-[15px] font-medium text-gray-700">Drop PDF, CSV, or Image here</p>
              <p className="text-[13px] text-gray-400 mt-1">or click to browse</p>
            </>
          )}
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className="card">
        <h2 className="text-[16px] font-semibold text-gray-900 mb-6">Manual entry {form.receiptImage && <span className="text-emerald-600 font-normal text-sm ml-2">(Reviewing OCR Data)</span>}</h2>
        
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-500 mb-1.5">Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[15px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-medium text-gray-500 mb-1.5">Amount (₹)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[15px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-1.5">Description / Merchant</label>
            <input 
              type="text" 
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[15px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
              placeholder="e.g. Groceries — cash"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-500 mb-1.5">Type</label>
              <select 
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[15px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-500 mb-1.5">Category</label>
              <select 
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[15px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
              >
                {form.type === "expense" ? (
                  <>
                    <option value="Food">Food & Dining</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Travel">Travel & Transport</option>
                    <option value="Bills">Bills & Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other Expense</option>
                  </>
                ) : (
                  <>
                    <option value="Salary">Salary</option>
                    <option value="Investment">Investment Return</option>
                    <option value="Refund">Refund</option>
                    <option value="Other">Other Income</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={saving}
              className="rounded-[12px] bg-emerald-500 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
