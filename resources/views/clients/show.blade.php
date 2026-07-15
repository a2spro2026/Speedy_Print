@extends('layouts.app')

@section('title', $client->company_name)
@section('page-title', $client->company_name)
@section('page-subtitle', $client->full_address ?: 'Fiche client')

@section('header-actions')
    <a href="{{ route('invoices.create', ['client_id' => $client->id]) }}" class="btn-secondary">Facturer</a>
    <a href="{{ route('clients.edit', $client) }}" class="btn-primary">Modifier</a>
@endsection

@section('content')
    <div class="grid gap-6 lg:grid-cols-3">
        <div class="card space-y-4 p-5 lg:col-span-1">
            <h2 class="font-bold">Coordonnées</h2>
            <dl class="space-y-3 text-sm">
                <div><dt class="text-muted">Contact</dt><dd class="font-medium">{{ $client->contact_name ?? '—' }}</dd></div>
                <div><dt class="text-muted">Email</dt><dd class="font-medium">{{ $client->email ?? '—' }}</dd></div>
                <div><dt class="text-muted">Téléphone</dt><dd class="font-medium">{{ $client->phone ?? '—' }}</dd></div>
                <div><dt class="text-muted">SIRET</dt><dd class="font-medium">{{ $client->siret ?? '—' }}</dd></div>
                <div><dt class="text-muted">TVA</dt><dd class="font-medium">{{ $client->vat_number ?? '—' }}</dd></div>
                @if($client->notes)
                    <div><dt class="text-muted">Notes</dt><dd class="font-medium">{{ $client->notes }}</dd></div>
                @endif
            </dl>
            <form method="POST" action="{{ route('clients.destroy', $client) }}" onsubmit="return confirm('Supprimer ce client ?')">
                @csrf
                @method('DELETE')
                <button type="submit" class="btn-danger w-full">Supprimer</button>
            </form>
        </div>

        <div class="card overflow-hidden lg:col-span-2">
            <div class="border-b border-slate-100 px-5 py-4">
                <h2 class="font-bold">Historique des factures</h2>
            </div>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>N°</th>
                            <th>Date</th>
                            <th>Échéance</th>
                            <th>Statut</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($client->invoices as $invoice)
                            <tr>
                                <td><a href="{{ route('invoices.show', $invoice) }}" class="font-semibold text-brand-700 hover:underline">{{ $invoice->number }}</a></td>
                                <td>{{ $invoice->issue_date->format('d/m/Y') }}</td>
                                <td>{{ $invoice->due_date->format('d/m/Y') }}</td>
                                <td><span class="badge badge-{{ $invoice->status }}">{{ $invoice->status_label }}</span></td>
                                <td class="text-right font-semibold">{{ money($invoice->total) }}</td>
                            </tr>
                        @empty
                            <tr><td colspan="5" class="py-10 text-center text-muted">Aucune facture pour ce client.</td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection
