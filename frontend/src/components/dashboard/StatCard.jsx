import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, color, index = 0, prefix = "₹" }) {
  const colorMap = {
    indigo:  { bg: "bg-brand-100 dark:bg-brand-500/15",  text: "text-brand-600 dark:text-brand-400"  },
    emerald: { bg: "bg-emerald-100 dark:bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400" },
    amber:   { bg: "bg-amber-100 dark:bg-amber-500/15",   text: "text-amber-600 dark:text-amber-400"   },
    purple:  { bg: "bg-purple-100 dark:bg-purple-500/15", text: "text-purple-600 dark:text-purple-400" },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card group cursor-default"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} transition-transform duration-200 group-hover:scale-110`}>
          <Icon size={20} className={c.text} />
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
        {prefix}{typeof value === "number" ? value.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : value}
      </p>
    </motion.div>
  );
}
