import Sidebar from "./Sidebar";

export default function DashboardLayout({ user, onLogout, activePage, onPageChange, children }) {
 return (
 <div className="flex min-h-screen bg-surface-50 ">
 <Sidebar user={user} onLogout={onLogout} activePage={activePage} onPageChange={onPageChange} />
 <main className="flex-1 overflow-y-auto">
 <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
 {children}
 </div>
 </main>
 </div>
 );
}
