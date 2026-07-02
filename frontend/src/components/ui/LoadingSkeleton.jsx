export function CardSkeleton({ className = "" }) {
 return <div className={`skeleton h-32 w-full rounded-2xl ${className}`} />;
}

export function ChartSkeleton({ className = "" }) {
 return <div className={`skeleton h-72 w-full rounded-2xl ${className}`} />;
}

export function TableSkeleton({ rows = 5 }) {
 return (
 <div className="space-y-3">
 <div className="skeleton h-10 w-full rounded-xl" />
 {Array.from({ length: rows }).map((_, i) => (
 <div key={i} className="skeleton h-12 w-full rounded-xl" />
 ))}
 </div>
 );
}

export function StatCardSkeleton() {
 return (
 <div className="card flex flex-col gap-3">
 <div className="flex items-center gap-3">
 <div className="skeleton h-10 w-10 rounded-xl" />
 <div className="skeleton h-4 w-24 rounded-lg" />
 </div>
 <div className="skeleton h-8 w-32 rounded-lg" />
 <div className="skeleton h-3 w-20 rounded-lg" />
 </div>
 );
}
