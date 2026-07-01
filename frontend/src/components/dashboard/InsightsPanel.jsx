import { motion } from "framer-motion";
import { Sparkles, Lightbulb, AlertTriangle, TrendingDown } from "lucide-react";

function getStyle(text) {
  const l = text.toLowerCase();
  if (l.includes("reduce") || l.includes("optimization"))
    return { border: "border-l-amber-400", icon: AlertTriangle, ic: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/5" };
  if (l.includes("savings") || l.includes("aside"))
    return { border: "border-l-emerald-400", icon: TrendingDown, ic: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/5" };
  return { border: "border-l-brand-400", icon: Lightbulb, ic: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-500/5" };
}

export default function InsightsPanel({ insights = [] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/15">
          <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">AI Insights</h3>
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Add expenses to unlock AI-powered insights.</p>
      ) : (
        <div className="space-y-3">
          {insights.map((text, i) => {
            const s = getStyle(text);
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                className={`flex items-start gap-3 rounded-xl border-l-4 ${s.border} ${s.bg} px-4 py-3`}>
                <s.icon size={16} className={`mt-0.5 shrink-0 ${s.ic}`} />
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
