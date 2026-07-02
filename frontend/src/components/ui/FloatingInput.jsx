export default function FloatingInput({
 label,
 type = "text",
 value,
 onChange,
 required = false,
 className = "",
}) {
 return (
 <label className={`group relative block ${className}`}>
 <input
 type={type}
 value={value}
 onChange={onChange}
 required={required}
 placeholder=" "
 className="peer w-full rounded-xl border border-surface-300 bg-white/80 px-4 pb-2 pt-6 text-sm text-gray-800 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 :border-brand-400 :ring-brand-500/20"
 />
 <span className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal ">
 {label}
 </span>
 </label>
 );
}
