export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return "₹0.00";
  const num = Number(amount);
  if (isNaN(num)) return "₹0.00";
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
