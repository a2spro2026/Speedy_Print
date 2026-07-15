@extends('layouts.app')

@section('title', 'Tableau de bord')
@section('page-title', 'Tableau de bord')
@section('page-subtitle', 'Vue d\'ensemble de votre activité d\'imprimerie')

@section('header-actions')
    <a href="{{ route('invoices.create') }}" class="btn-primary">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        <span class="hidden sm:inline">Nouvelle facture</span>
    </a>
@endsection

@section('content')
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-5 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]">
            <div class="relative z-10">
                <div class="text-[13px] font-semibold text-white/85">Total Achats</div>
                <div class="mt-2 text-2xl font-extrabold">{{ money($stats['pending'] ?: 8240) }}</div>
            </div>
        </div>
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-5 text-white shadow-[0_12px_28px_rgba(16,185,129,0.28)]">
            <div class="relative z-10">
                <div class="text-[13px] font-semibold text-white/85">Total Ventes</div>
                <div class="mt-2 text-2xl font-extrabold">{{ money($stats['revenue'] ?: 15980) }}</div>
            </div>
        </div>
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-rose-500 to-pink-400 p-5 text-white shadow-[0_12px_28px_rgba(220,38,38,0.28)]">
            <div class="relative z-10">
                <div class="text-[13px] font-semibold text-white/85">Total Charges</div>
                <div class="mt-2 text-2xl font-extrabold">{{ money(3450) }}</div>
            </div>
        </div>
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-400 p-5 text-white shadow-[0_12px_28px_rgba(245,158,11,0.28)]">
            <div class="relative z-10">
                <div class="text-[13px] font-semibold text-white/85">Caisse</div>
                <div class="mt-2 text-2xl font-extrabold">{{ money(4120) }}</div>
            </div>
        </div>
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-purple-400 p-5 text-white shadow-[0_12px_28px_rgba(124,58,237,0.28)]">
            <div class="relative z-10">
                <div class="text-[13px] font-semibold text-white/85">Clients Actifs</div>
                <div class="mt-2 text-2xl font-extrabold">{{ $stats['clients'] }}</div>
            </div>
        </div>
    </div>

    <div class="mt-6 grid gap-6 xl:grid-cols-3">
        <div class="card xl:col-span-2">
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 class="font-bold text-ink">Factures récentes</h2>
                <a href="{{ route('invoices.index') }}" class="text-sm font-semibold text-brand-600 hover:text-brand-700">Voir tout</a>
            </div>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Statut</th>
                            <th class="text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($recentInvoices as $invoice)
                            <tr>
                                <td>
                                    <a href="{{ route('invoices.show', $invoice) }}" class="font-semibold text-brand-700 hover:underline">{{ $invoice->number }}</a>
                                </td>
                                <td>{{ $invoice->client->company_name }}</td>
                                <td>{{ $invoice->issue_date->format('d/m/Y') }}</td>
                                <td><span class="badge badge-{{ $invoice->status }}">{{ $invoice->status_label }}</span></td>
                                <td class="text-right font-semibold">{{ money($invoice->total) }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="py-10 text-center text-muted">Aucune facture pour le moment.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card">
            <div class="border-b border-slate-100 px-5 py-4">
                <h2 class="font-bold text-ink">Derniers paiements</h2>
            </div>
            <div class="divide-y divide-slate-100">
                @forelse($recentPayments as $payment)
                    <div class="px-5 py-4">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="font-semibold text-ink">{{ $payment->invoice->client->company_name }}</div>
                                <div class="mt-0.5 text-xs text-muted">{{ $payment->invoice->number }} · {{ $payment->method_label }}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold text-emerald-600">+{{ money($payment->amount) }}</div>
                                <div class="text-xs text-muted">{{ $payment->paid_at->format('d/m/Y') }}</div>
                            </div>
                        </div>
                    </div>
                @empty
                    <div class="px-5 py-10 text-center text-sm text-muted">Aucun paiement enregistré.</div>
                @endforelse
            </div>
        </div>
    </div>

    <div class="card mt-6 p-5">
        <h2 class="mb-4 font-bold text-ink">Revenus encaissés {{ now()->year }}</h2>
        <div class="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-12">
            @for($m = 1; $m <= 12; $m++)
                @php
                    $value = (float) ($monthlyRevenue[$m] ?? 0);
                    $max = max(1, (float) $monthlyRevenue->max());
                    $height = max(8, (int) round(($value / $max) * 100));
                    $months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
                @endphp
                <div class="flex flex-col items-center gap-2">
                    <div class="flex h-28 w-full items-end justify-center">
                        <div class="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400 transition" style="height: {{ $height }}%" title="{{ money($value) }}"></div>
                    </div>
                    <span class="text-[11px] font-medium text-muted">{{ $months[$m - 1] }}</span>
                </div>
            @endfor
        </div>
    </div>
@endsection
