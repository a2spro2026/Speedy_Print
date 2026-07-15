@extends('layouts.app')

@section('title', 'Factures')
@section('page-title', 'Factures')
@section('page-subtitle', 'Suivi et émission des factures')

@section('header-actions')
    <a href="{{ route('invoices.create') }}" class="btn-primary">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nouvelle facture
    </a>
@endsection

@section('content')
    <form method="GET" class="card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
        <input type="search" name="q" value="{{ $search }}" placeholder="N° facture ou client..." class="input">
        <select name="status" class="input">
            <option value="">Tous les statuts</option>
            @foreach($statuses as $key => $label)
                <option value="{{ $key }}" @selected($status === $key)>{{ $label }}</option>
            @endforeach
        </select>
        <button type="submit" class="btn-secondary">Filtrer</button>
    </form>

    <div class="card overflow-hidden">
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>N°</th>
                        <th>Client</th>
                        <th>Émission</th>
                        <th>Échéance</th>
                        <th>Statut</th>
                        <th class="text-right">Total TTC</th>
                        <th class="text-right">Solde</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($invoices as $invoice)
                        <tr>
                            <td>
                                <a href="{{ route('invoices.show', $invoice) }}" class="font-semibold text-brand-700 hover:underline">{{ $invoice->number }}</a>
                            </td>
                            <td>{{ $invoice->client->company_name }}</td>
                            <td>{{ $invoice->issue_date->format('d/m/Y') }}</td>
                            <td>{{ $invoice->due_date->format('d/m/Y') }}</td>
                            <td><span class="badge badge-{{ $invoice->status }}">{{ $invoice->status_label }}</span></td>
                            <td class="text-right font-semibold">{{ money($invoice->total) }}</td>
                            <td class="text-right {{ $invoice->balance > 0 ? 'text-amber-600' : 'text-emerald-600' }}">
                                {{ money($invoice->balance) }}
                            </td>
                            <td class="text-right">
                                <a href="{{ route('invoices.show', $invoice) }}" class="btn-ghost px-2 py-1 text-xs">Ouvrir</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="py-12 text-center text-muted">Aucune facture trouvée.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($invoices->hasPages())
            <div class="border-t border-slate-100 px-4 py-3">{{ $invoices->links() }}</div>
        @endif
    </div>
@endsection
