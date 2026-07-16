"use client";

import {
  ShoppingCart,
  TrendingUp,
  Receipt,
  Wallet,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";

type StatCard = {
  label: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  glow: string;
  iconBg: string;
};

const stats: StatCard[] = [
  {
    label: "Total Achats",
    value: formatMoney(0),
    icon: ShoppingCart,
    gradient: "from-[#2563EB] via-[#3B82F6] to-[#60A5FA]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
  {
    label: "Total Ventes",
    value: formatMoney(0),
    icon: TrendingUp,
    gradient: "from-[#059669] via-[#10B981] to-[#34D399]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
  {
    label: "Total Charges",
    value: formatMoney(0),
    icon: Receipt,
    gradient: "from-[#DC2626] via-[#F43F5E] to-[#FB7185]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
  {
    label: "Caisse",
    value: formatMoney(0),
    icon: Wallet,
    gradient: "from-[#D97706] via-[#F59E0B] to-[#FBBF24]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
  {
    label: "Clients Actifs",
    value: "0",
    icon: Users,
    gradient: "from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
];

const MOIS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const chartData = MOIS.map((mois) => ({
  mois,
  achats: 0,
  ventes: 0,
  charges: 0,
}));

function InvoiceTable({
  title,
  accent,
  headers,
  emptyLabel,
}: {
  title: string;
  accent: string;
  headers: string[];
  emptyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className={`border-b border-slate-100 px-5 py-4 ${accent}`}>
        <h2 className="text-base font-extrabold tracking-tight text-ink">
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-10 text-center text-sm text-muted"
              >
                {emptyLabel}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-4 px-4 pb-4 pt-2 md:space-y-5 md:px-6 md:pb-6 md:pt-3">
      <div className="stat-cards-bar">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`stat-card-fixed relative h-[96px] overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} px-4 py-3.5 text-white ${stat.glow}`}
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-black/10"
                  aria-hidden
                />

                <div className="relative z-10 flex h-full items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-semibold tracking-wide text-white/85">
                      {stat.label}
                    </div>
                    <div className="mt-2 text-2xl font-extrabold tracking-tight md:text-[1.65rem]">
                      {stat.value}
                    </div>
                  </div>
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ring-1 ring-white/30`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-ink md:text-lg">
              Évolution annuelle {new Date().getFullYear()}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" /> Achats
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Ventes
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F43F5E]" /> Charges
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="18%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="mois"
                tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 10]}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.12)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                  fontSize: 13,
                }}
                formatter={(value) => [formatMoney(Number(value))]}
              />
              <Legend wrapperStyle={{ display: "none" }} />
              <Bar dataKey="achats" name="Achats" fill="#2563EB" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="ventes" name="Ventes" fill="#10B981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="charges" name="Charges" fill="#F43F5E" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <InvoiceTable
          title="Les 5 Dernières Factures d'achat"
          accent="bg-gradient-to-r from-blue-50 to-white"
          headers={["N°", "Fournisseur", "Date", "Montant", "Statut"]}
          emptyLabel="Aucune facture d'achat pour le moment."
        />
        <InvoiceTable
          title="Les 5 Dernières Factures de Vente"
          accent="bg-gradient-to-r from-emerald-50 to-white"
          headers={["N°", "Client", "Date", "Montant", "Statut"]}
          emptyLabel="Aucune facture de vente pour le moment."
        />
      </div>
    </div>
  );
}
