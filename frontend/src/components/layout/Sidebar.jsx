import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
 LayoutDashboard, UploadCloud, List, TrendingUp, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight
} from "lucide-react";

const NAV_ITEMS = [
 { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
 { id: "upload", label: "Upload", icon: UploadCloud },
 { id: "transactions", label: "Transactions", icon: List },
 { id: "analytics", label: "Analytics", icon: TrendingUp },
 { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ user, onLogout, activePage, onPageChange }) {
 const [collapsed, setCollapsed] = useState(false);
 const [mobileOpen, setMobileOpen] = useState(false);

 const sidebarContent = (
 <>
 {/* Logo */}
 <div className="flex items-center gap-3 px-4 pt-6 pb-6">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-lg shadow-sm">
 L
 </div>
 <AnimatePresence>
 {!collapsed && (
 <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
 className="overflow-hidden whitespace-nowrap text-lg font-semibold text-gray-900 tracking-tight">
 LENE
 </motion.span>
 )}
 </AnimatePresence>
 </div>

 {/* Navigation */}
 <nav className="flex-1 space-y-1 px-3">
 {NAV_ITEMS.map((item) => {
 const isActive = activePage === item.id;
 return (
 <button key={item.id}
 onClick={() => { onPageChange(item.id); setMobileOpen(false); }}
 className={`group relative flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] font-medium transition-all duration-200 ${
 isActive
 ? "bg-emerald-50 text-emerald-700"
 : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
 }`}>
 {isActive && (
 <motion.div layoutId="sidebar-active"
 className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500"
 transition={{ type: "spring", stiffness: 350, damping: 30 }} />
 )}
 <item.icon size={20} className="shrink-0" />
 <AnimatePresence>
 {!collapsed && (
 <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
 className="overflow-hidden whitespace-nowrap">
 {item.label}
 </motion.span>
 )}
 </AnimatePresence>
 </button>
 );
 })}
 </nav>

 {/* Bottom */}
 <div className="space-y-2 border-t border-[#E5E7EB] p-3">
 <div className="flex items-center gap-3 rounded-xl px-3 py-2">
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
 {user?.name?.charAt(0)?.toUpperCase() || "U"}
 </div>
 <AnimatePresence>
 {!collapsed && (
 <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
 className="flex-1 overflow-hidden">
 <p className="truncate text-sm font-semibold text-gray-800 ">{user?.name || "User"}</p>
 <p className="truncate text-xs text-gray-400">{user?.email}</p>
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <button onClick={onLogout}
 className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-all hover:bg-red-50 :bg-red-500/10">
 <LogOut size={20} className="shrink-0" />
 <AnimatePresence>
 {!collapsed && (
 <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
 className="overflow-hidden whitespace-nowrap">
 Logout
 </motion.span>
 )}
 </AnimatePresence>
 </button>
 </div>

 <button onClick={() => setCollapsed((v) => !v)}
 className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 items-center justify-center rounded-full border border-surface-200 bg-white text-gray-400 shadow-sm transition hover:text-brand-600 :text-brand-400">
 {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
 </button>
 </>
 );

 return (
 <>
 <button onClick={() => setMobileOpen(true)}
 className="fixed left-4 top-4 z-50 rounded-xl border border-surface-200 bg-white p-2 shadow-soft lg:hidden ">
 <Menu size={20} className="text-gray-600 " />
 </button>

 <AnimatePresence>
 {mobileOpen && (
 <>
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" />
 <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
 transition={{ type: "spring", stiffness: 300, damping: 30 }}
 className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-surface-200 bg-white lg:hidden ">
 <button onClick={() => setMobileOpen(false)}
 className="absolute right-3 top-5 rounded-lg p-1 text-gray-400 hover:text-gray-600 :text-gray-200">
 <X size={18} />
 </button>
 {sidebarContent}
 </motion.aside>
 </>
 )}
 </AnimatePresence>

 <motion.aside animate={{ width: collapsed ? 72 : 256 }}
 transition={{ type: "spring", stiffness: 300, damping: 30 }}
 className="relative hidden lg:flex h-screen sticky top-0 flex-col border-r border-surface-200 bg-white "
 style={{ minWidth: collapsed ? 72 : 256 }}>
 {sidebarContent}
 </motion.aside>
 </>
 );
}
