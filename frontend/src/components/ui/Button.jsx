import { motion } from "framer-motion";

const variants = {
 primary:
 "bg-emerald-500 text-white shadow-md hover:shadow-lg hover:bg-emerald-600 active:scale-[0.97]",
 secondary:
 "border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.97]",
 danger:
 "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md hover:shadow-lg active:scale-[0.97]",
 ghost:
 "text-gray-600 hover:bg-gray-100 active:scale-[0.97]",
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
 className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
 {...props}
 >
 {children}
 </motion.button>
 );
}
