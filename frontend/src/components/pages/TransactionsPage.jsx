import React, { useState, useMemo } from "react";
import { Search, Filter, ChevronDown, ChevronUp, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import api from "../../api";
import { formatCurrency } from "../../utils/formatters";

export default function TransactionsPage({ expenses, onDelete, onReload }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = (exp.note || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (exp.merchant || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoryFilter === "all" || exp.category === categoryFilter;
      const matchType = typeFilter === "all" || exp.type === typeFilter;
      return matchSearch && matchCat && matchType;
    });
  }, [expenses, searchTerm, categoryFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-[20px] font-semibold text-gray-900">Transactions</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-[12px] border border-gray-200 text-[14px] outline-none focus:border-emerald-500 w-full sm:w-64"
            />
          </div>
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-[12px] border border-gray-200 text-[14px] outline-none focus:border-emerald-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-[12px] font-semibold text-gray-500 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400 text-[14px]">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <React.Fragment key={exp._id}>
                    <tr className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 text-[14px] text-gray-600 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[14px] font-medium text-gray-900">{exp.note || exp.merchant}</p>
                        {exp.source === "ocr" && <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">AI Extracted</span>}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-gray-600">
                        {exp.category}
                      </td>
                      <td className={`px-6 py-4 text-[14px] font-medium text-right whitespace-nowrap ${exp.type === "income" ? "text-green-600" : "text-gray-900"}`}>
                        {exp.type === "income" ? "+" : "-"}{formatCurrency(exp.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => setExpandedId(expandedId === exp._id ? null : exp._id)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          {expandedId === exp._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {expandedId === exp._id && (
                      <tr className="bg-gray-50/50 border-t border-gray-100">
                        <td colSpan="5" className="px-6 py-6">
                          <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex-1 space-y-4">
                              <h4 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider">Transaction Details</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[12px] text-gray-500">Payment Mode</p>
                                  <p className="text-[14px] text-gray-900">{exp.paymentMode || "Unknown"}</p>
                                </div>
                                <div>
                                  <p className="text-[12px] text-gray-500">Currency</p>
                                  <p className="text-[14px] text-gray-900">{exp.currency || "INR"}</p>
                                </div>
                                {exp.confidenceScore > 0 && (
                                  <div>
                                    <p className="text-[12px] text-gray-500">AI Confidence</p>
                                    <p className="text-[14px] text-green-600 font-medium">{exp.confidenceScore}%</p>
                                  </div>
                                )}
                              </div>
                              <div className="pt-4 flex gap-3">
                                <button 
                                  onClick={() => onDelete(exp._id)}
                                  className="flex items-center gap-1.5 text-[13px] font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                            
                            {exp.ocrText && (
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText size={16} className="text-gray-400" />
                                  <h4 className="text-[13px] font-semibold text-gray-900">Extracted Text</h4>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-3 text-[12px] text-gray-500 h-32 overflow-y-auto font-mono">
                                  {exp.ocrText}
                                </div>
                              </div>
                            )}

                            {exp.receiptImage && (
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon size={16} className="text-gray-400" />
                                  <h4 className="text-[13px] font-semibold text-gray-900">Receipt Image</h4>
                                </div>
                                <a href={`http://localhost:5000/api/uploads/${exp.receiptImage.split('/').pop()}`} target="_blank" rel="noreferrer" className="block w-full h-32 bg-gray-200 rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
                                  <img src={`http://localhost:5000/api/uploads/${exp.receiptImage.split('/').pop()}`} alt="Receipt" className="w-full h-full object-cover" />
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
