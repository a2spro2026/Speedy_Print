@extends('layouts.app')

@section('title', 'Clients')
@section('page-title', 'Clients')
@section('page-subtitle', 'Gestion de votre portefeuille clients')

@section('header-actions')
    <a href="{{ route('clients.create') }}" class="btn-primary">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nouveau client
    </a>
@endsection

@section('content')
    <form method="GET" class="card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input type="search" name="q" value="{{ $search }}" placeholder="Rechercher un client..." class="input flex-1">
        <button type="submit" class="btn-secondary">Rechercher</button>
    </form>

    <div class="card overflow-hidden">
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Entreprise</th>
                        <th>Contact</th>
                        <th>Email / Téléphone</th>
                        <th>Ville</th>
                        <th>Factures</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($clients as $client)
                        <tr>
                            <td class="font-semibold">
                                <a href="{{ route('clients.show', $client) }}" class="text-brand-700 hover:underline">{{ $client->company_name }}</a>
                            </td>
                            <td>{{ $client->contact_name ?? '—' }}</td>
                            <td>
                                <div>{{ $client->email ?? '—' }}</div>
                                <div class="text-xs text-muted">{{ $client->phone ?? '' }}</div>
                            </td>
                            <td>{{ $client->city ?? '—' }}</td>
                            <td>{{ $client->invoices_count }}</td>
                            <td class="text-right">
                                <a href="{{ route('clients.edit', $client) }}" class="btn-ghost px-2 py-1 text-xs">Modifier</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="py-12 text-center text-muted">Aucun client trouvé.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($clients->hasPages())
            <div class="border-t border-slate-100 px-4 py-3">{{ $clients->links() }}</div>
        @endif
    </div>
@endsection
