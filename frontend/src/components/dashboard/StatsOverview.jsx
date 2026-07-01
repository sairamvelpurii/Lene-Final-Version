import { Wallet, PiggyBank, ShieldCheck, TrendingUp } from "lucide-react";
import StatCard from "./StatCard";
import { StatCardSkeleton } from "../ui/LoadingSkeleton";

export default function StatsOverview({ summary, recommendation, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Spend",
      value: summary?.total_spend ?? 0,
      icon: Wallet,
      color: "indigo",
    },
    {
      label: "Predicted Next Month",
      value: recommendation?.predicted_next_month_expense ?? 0,
      icon: TrendingUp,
      color: "purple",
    },
    {
      label: "Emergency Fund",
      value: recommendation?.emergency_fund ?? 0,
      icon: ShieldCheck,
      color: "amber",
    },
    {
      label: "Suggested Savings",
      value: recommendation?.suggested_savings ?? 0,
      icon: PiggyBank,
      color: "emerald",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <StatCard key={card.label} index={i} {...card} />
      ))}
    </div>
  );
}
