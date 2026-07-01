import { motion } from "framer-motion";

const variants = {
  primary:
    "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md hover:shadow-lg hover:from-brand-700 hover:to-brand-600 active:scale-[0.97]",
  secondary:
    "border border-brand-200 text-brand-700 bg-brand-50 hover:bg-brand-100 active:scale-[0.97] dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20",
  danger:
    "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md hover:shadow-lg active:scale-[0.97]",
  ghost:
    "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 active:scale-[0.97]",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
