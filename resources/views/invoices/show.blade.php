@extends('layouts.app')

@section('title', $invoice->number)
@section('page-title', $invoice->number)
@section('page-subtitle', 'Facture — '.$invoice->client->company_name)

@section('header-actions')
    <a href="{{ route('invoices.print', $invoice) }}" target="_blank" class="btn-secondary">Imprimer</a>
    @if($invoice->status !== 'paid')
        <a href="{{ route('invoices.edit', $invoice) }}" class="btn-primary">Modifier</a>
    @endif
@endsection

@section('content')
    <div class="mb-5 flex flex-wrap items-center gap-2">
        <span class="badge badge-{{ $invoice->status }} text-sm">{{ $invoice->status_label }}</span>
        @if($invoice->status === 'draft')
            <form method="POST" action="{{ route('invoices.send', $invoice) }}">
                @csrf
                <button type="submit" class="btn-secondary text-xs">Marquer comme envoyée</button>
            </form>
        @endif
        @if($invoice->status !== 'paid')
            <form method="POST" action="{{ route('invoices.destroy', $invoice) }}" onsubmit="return confirm('Supprimer cette facture ?')">
                @csrf
                @method('DELETE')
                <button type="submit" class="btn-ghost text-xs text-red-600">Supprimer</button>
            </form>
        @endif
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
        <div class="space-y-6 xl:col-span-2">
            <div class="card p-5 md:p-6">
                <div class="grid gap-6 sm:grid-cols-2">
                    <div>
                        <div class="text-xs font-semibold uppercase tracking-wide text-muted">Client</div>
                        <div class="mt-2 font-bold text-ink">{{ $invoice->client->company_name }}</div>
                        <div class="mt-1 text-sm text-muted whitespace-pre-line">{{ $invoice->client->full_address }}</div>
                        @if($invoice->client->email)
                            <div class="mt-1 text-sm">{{ $invoice->client->email }}</div>
                        @endif
                    </div>
                    <div class="sm:text-right">
                        <div class="text-xs font-semibold uppercase tracking-wide text-muted">Dates</div>
                        <div class="mt-2 text-sm"><span class="text-muted">Émission :</span> <strong>{{ $invoice->issue_date->format('d/m/Y') }}</strong></div>
                        <div class="text-sm"><span class="text-muted">Échéance :</span> <strong>{{ $invoice->due_date->format('d/m/Y') }}</strong></div>
                        <div class="mt-3 text-sm"><span class="text-muted">Solde restant :</span> <strong class="{{ $invoice->balance > 0 ? 'text-amber-600' : 'text-emerald-600' }}">{{ money($invoice->balance) }}</strong></div>
                    </div>
                </div>
            </div>

            <div class="card overflow-hidden">
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Qté</th>
                                <th>P.U. HT</th>
                                <th>TVA</th>
                                <th class="text-right">Total HT</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($invoice->items as $item)
                                <tr>
                                    <td>
                                        <div class="font-medium">{{ $item->description }}</div>
                                        <div class="text-xs text-muted">{{ $item->unit }}</div>
                                    </td>
                                    <td>{{ number_format($item->quantity, 2, ',', ' ') }}</td>
                                    <td>{{ money($item->unit_price) }}</td>
                                    <td>{{ number_format($item->tax_rate, 0) }}%</td>
                                    <td class="text-right font-semibold">{{ money($item->line_ht) }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                <div class="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div class="w-full max-w-xs space-y-2 text-sm">
                        <div class="flex justify-between"><span class="text-muted">Total HT</span><span class="font-semibold">{{ money($invoice->subtotal) }}</span></div>
                        <div class="flex justify-between"><span class="text-muted">TVA</span><span class="font-semibold">{{ money($invoice->tax_amount) }}</span></div>
                        <div class="flex justify-between border-t border-slate-200 pt-2 text-base"><span class="font-bold">Total TTC</span><span class="font-extrabold text-brand-700">{{ money($invoice->total) }}</span></div>
                        <div class="flex justify-between"><span class="text-muted">Déjà payé</span><span class="font-semibold text-emerald-600">{{ money($invoice->amount_paid) }}</span></div>
                    </div>
                </div>
            </div>

            @if($invoice->notes || $invoice->terms)
                <div class="card space-y-3 p-5 text-sm">
                    @if($invoice->notes)
                        <div><div class="font-semibold text-ink">Notes</div><p class="mt-1 text-muted">{{ $invoice->notes }}</p></div>
                    @endif
                    @if($invoice->terms)
                        <div><div class="font-semibold text-ink">Conditions</div><p class="mt-1 text-muted">{{ $invoice->terms }}</p></div>
                    @endif
                </div>
            @endif
        </div>

        <div class="space-y-6">
            @if($invoice->balance > 0 && $invoice->status !== 'cancelled' && $invoice->status !== 'draft')
                <div class="card p-5">
                    <h2 class="mb-4 font-bold">Enregistrer un paiement</h2>
                    <form method="POST" action="{{ route('invoices.payments.store', $invoice) }}" class="space-y-3">
                        @csrf
                        <div>
                            <label class="label" for="amount">Montant</label>
                            <input id="amount" type="number" step="0.01" min="0.01" max="{{ $invoice->balance }}" name="amount" class="input" value="{{ old('amount', $invoice->balance) }}" required>
                        </div>
                        <div>
                            <label class="label" for="method">Mode</label>
                            <select id="method" name="method" class="input" required>
                                @foreach(\App\Models\Payment::METHODS as $key => $label)
                                    <option value="{{ $key }}" @selected(old('method', 'virement') === $key)>{{ $label }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="label" for="paid_at">Date</label>
                            <input id="paid_at" type="date" name="paid_at" class="input" value="{{ old('paid_at', now()->format('Y-m-d')) }}" required>
                        </div>
                        <div>
                            <label class="label" for="reference">Référence</label>
                            <input id="reference" type="text" name="reference" class="input" value="{{ old('reference') }}">
                        </div>
                        <button type="submit" class="btn-primary w-full">Valider le paiement</button>
                    </form>
                </div>
            @endif

            <div class="card overflow-hidden">
                <div class="border-b border-slate-100 px-5 py-4">
                    <h2 class="font-bold">Paiements</h2>
                </div>
                <div class="divide-y divide-slate-100">
                    @forelse($invoice->payments as $payment)
                        <div class="px-5 py-3 text-sm">
                            <div class="flex justify-between gap-3">
                                <div>
                                    <div class="font-semibold">{{ $payment->method_label }}</div>
                                    <div class="text-xs text-muted">{{ $payment->paid_at->format('d/m/Y') }} @if($payment->reference)· {{ $payment->reference }}@endif</div>
                                </div>
                                <div class="font-bold text-emerald-600">{{ money($payment->amount) }}</div>
                            </div>
                        </div>
                    @empty
                        <div class="px-5 py-8 text-center text-sm text-muted">Aucun paiement.</div>
                    @endforelse
                </div>
            </div>
        </div>
    </div>
@endsection
