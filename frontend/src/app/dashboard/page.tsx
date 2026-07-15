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
    value: formatMoney(8240),
    icon: ShoppingCart,
    gradient: "from-[#2563EB] via-[#3B82F6] to-[#60A5FA]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
  {
    label: "Total Ventes",
    value: formatMoney(15980),
    icon: TrendingUp,
    gradient: "from-[#059669] via-[#10B981] to-[#34D399]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
  {
    label: "Total Charges",
    value: formatMoney(3450),
    icon: Receipt,
    gradient: "from-[#DC2626] via-[#F43F5E] to-[#FB7185]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
  {
    label: "Caisse",
    value: formatMoney(4120),
    icon: Wallet,
    gradient: "from-[#D97706] via-[#F59E0B] to-[#FBBF24]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
  {
    label: "Clients Actifs",
    value: "24",
    icon: Users,
    gradient: "from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA]",
    glow: "shadow-md",
    iconBg: "bg-white/20",
  },
];

const achatsRecents = [
  { numero: "FA-2026-0142", fournisseur: "Papeterie Atlas", date: "12/07/2026", montant: formatMoney(1240), statut: "Payée" },
  { numero: "FA-2026-0141", fournisseur: "Encre & Co", date: "10/07/2026", montant: formatMoney(680.5), statut: "En attente" },
  { numero: "FA-2026-0140", fournisseur: "Machine Print Pro", date: "08/07/2026", montant: formatMoney(3150), statut: "Payée" },
  { numero: "FA-2026-0139", fournisseur: "Carton Plus", date: "05/07/2026", montant: formatMoney(420), statut: "Partielle" },
  { numero: "FA-2026-0138", fournisseur: "Xerox Maroc", date: "02/07/2026", montant: formatMoney(890), statut: "Payée" },
];

const ventesRecentes = [
  { numero: "FV-2026-0288", client: "Agence Nova Com", date: "13/07/2026", montant: formatMoney(2180), statut: "Payée" },
  { numero: "FV-2026-0287", client: "Boulangerie Dupont", date: "11/07/2026", montant: formatMoney(345), statut: "Envoyée" },
  { numero: "FV-2026-0286", client: "Tech Solutions SARL", date: "09/07/2026", montant: formatMoney(1560), statut: "Payée" },
  { numero: "FV-2026-0285", client: "Mairie de Caluire", date: "06/07/2026", montant: formatMoney(4200), statut: "En retard" },
  { numero: "FV-2026-0284", client: "Studio Lumière", date: "03/07/2026", montant: formatMoney(780), statut: "Payée" },
];

const chartData = [
  { mois: "Jan", achats: 4200, ventes: 7800, charges: 2100 },
  { mois: "Fév", achats: 3900, ventes: 7200, charges: 1950 },
  { mois: "Mar", achats: 5100, ventes: 9100, charges: 2400 },
  { mois: "Avr", achats: 4600, ventes: 8600, charges: 2200 },
  { mois: "Mai", achats: 5800, ventes: 10200, charges: 2650 },
  { mois: "Jun", achats: 5400, ventes: 9800, charges: 2500 },
  { mois: "Jul", achats: 6200, ventes: 11500, charges: 2800 },
  { mois: "Aoû", achats: 4800, ventes: 8900, charges: 2300 },
  { mois: "Sep", achats: 5500, ventes: 10600, charges: 2550 },
  { mois: "Oct", achats: 6100, ventes: 11200, charges: 2700 },
  { mois: "Nov", achats: 6700, ventes: 12400, charges: 2900 },
  { mois: "Déc", achats: 7200, ventes: 13800, charges: 3100 },
];

function statutClass(statut: string) {
  switch (statut) {
    case "Payée":
      return "bg-emerald-100 text-emerald-700";
    case "En attente":
    case "Envoyée":
      return "bg-blue-100 text-blue-700";
    case "Partielle":
      return "bg-amber-100 text-amber-800";
    case "En retard":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function InvoiceTable({
  title,
  accent,
  headers,
  rows,
}: {
  title: string;
  accent: string;
  headers: string[];
  rows: Array<Record<string, string>>;
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
            {rows.map((row) => (
              <tr
                key={row.numero}
                className="border-b border-slate-50 last:border-0"
              >
                <td className="px-4 py-3 font-semibold text-brand">
                  {row.numero}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {row.fournisseur || row.client}
                </td>
                <td className="px-4 py-3 text-slate-500">{row.date}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-800">
                  {row.montant}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statutClass(row.statut)}`}
                  >
                    {row.statut}
                  </span>
                </td>
              </tr>
            ))}
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

      {/* Diagramme annuel */}
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
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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

      {/* Tableaux */}
      <div className="grid gap-6 xl:grid-cols-2">
        <InvoiceTable
          title="Les 5 Dernières Factures d'achat"
          accent="bg-gradient-to-r from-blue-50 to-white"
          headers={["N°", "Fournisseur", "Date", "Montant", "Statut"]}
          rows={achatsRecents}
        />
        <InvoiceTable
          title="Les 5 Dernières Factures de Vente"
          accent="bg-gradient-to-r from-emerald-50 to-white"
          headers={["N°", "Client", "Date", "Montant", "Statut"]}
          rows={ventesRecentes}
        />
      </div>
    </div>
  );
}
