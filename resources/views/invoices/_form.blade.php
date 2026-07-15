@php
    $oldItems = old('items');
    if (!$oldItems && $invoice) {
        $oldItems = $invoice->items->map(fn ($item) => [
            'product_id' => $item->product_id,
            'description' => $item->description,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'unit_price' => $item->unit_price,
            'tax_rate' => $item->tax_rate,
        ])->toArray();
    }
    if (!$oldItems) {
        $oldItems = [[
            'product_id' => '',
            'description' => '',
            'quantity' => 1,
            'unit' => 'unité',
            'unit_price' => '0.00',
            'tax_rate' => 20,
        ]];
    }
    $selectedClient = old('client_id', $invoice?->client_id ?? request('client_id'));
@endphp

<div class="card space-y-4 p-5 md:p-6">
    <h2 class="font-bold text-ink">Informations générales</h2>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="md:col-span-2">
            <label class="label" for="client_id">Client *</label>
            <select id="client_id" name="client_id" class="input" required>
                <option value="">Sélectionner un client</option>
                @foreach($clients as $client)
                    <option value="{{ $client->id }}" @selected((string) $selectedClient === (string) $client->id)>{{ $client->company_name }}</option>
                @endforeach
            </select>
            @error('client_id')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
        </div>
        <div>
            <label class="label" for="issue_date">Date d'émission *</label>
            <input id="issue_date" type="date" name="issue_date" class="input" value="{{ old('issue_date', optional($invoice?->issue_date)->format('Y-m-d') ?? now()->format('Y-m-d')) }}" required>
        </div>
        <div>
            <label class="label" for="due_date">Échéance *</label>
            <input id="due_date" type="date" name="due_date" class="input" value="{{ old('due_date', optional($invoice?->due_date)->format('Y-m-d') ?? now()->addDays(30)->format('Y-m-d')) }}" required>
            @error('due_date')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
        </div>
        @if(!$invoice || $invoice->status === 'draft')
            <div>
                <label class="label" for="status">Statut</label>
                <select id="status" name="status" class="input">
                    <option value="draft" @selected(old('status', $invoice?->status ?? 'draft') === 'draft')>Brouillon</option>
                    <option value="sent" @selected(old('status', $invoice?->status) === 'sent')>Envoyée</option>
                </select>
            </div>
        @endif
        <div class="md:col-span-2">
            <label class="label" for="notes">Notes</label>
            <textarea id="notes" name="notes" rows="2" class="input" placeholder="Message au client...">{{ old('notes', $invoice?->notes) }}</textarea>
        </div>
        <div class="md:col-span-2">
            <label class="label" for="terms">Conditions</label>
            <textarea id="terms" name="terms" rows="2" class="input">{{ old('terms', $invoice?->terms ?? 'Paiement à 30 jours. Pénalités de retard applicables.') }}</textarea>
        </div>
    </div>
</div>

<div class="card overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 class="font-bold text-ink">Lignes de facturation</h2>
        <button type="button" id="add-line" class="btn-secondary text-xs">+ Ajouter une ligne</button>
    </div>

    @error('items')
        <div class="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{{ $message }}</div>
    @enderror

    <div class="table-wrap">
        <table class="data-table" id="lines-table">
            <thead>
                <tr>
                    <th class="min-w-[180px]">Prestation</th>
                    <th class="min-w-[200px]">Description</th>
                    <th>Qté</th>
                    <th>Unité</th>
                    <th>P.U. HT</th>
                    <th>TVA %</th>
                    <th class="text-right">Total HT</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="lines-body">
                @foreach($oldItems as $index => $item)
                    <tr class="line-row" data-index="{{ $index }}">
                        <td>
                            <select name="items[{{ $index }}][product_id]" class="input product-select text-xs">
                                <option value="">Libre</option>
                                @foreach($products as $product)
                                    <option
                                        value="{{ $product->id }}"
                                        data-name="{{ $product->name }}"
                                        data-price="{{ $product->unit_price }}"
                                        data-unit="{{ $product->unit }}"
                                        data-tax="{{ $product->tax_rate }}"
                                        @selected((string) ($item['product_id'] ?? '') === (string) $product->id)
                                    >{{ $product->name }}</option>
                                @endforeach
                            </select>
                        </td>
                        <td><input type="text" name="items[{{ $index }}][description]" class="input text-xs desc-input" value="{{ $item['description'] ?? '' }}" required></td>
                        <td><input type="number" step="0.01" min="0.01" name="items[{{ $index }}][quantity]" class="input qty-input w-20 text-xs" value="{{ $item['quantity'] ?? 1 }}" required></td>
                        <td><input type="text" name="items[{{ $index }}][unit]" class="input unit-input w-24 text-xs" value="{{ $item['unit'] ?? 'unité' }}" required></td>
                        <td><input type="number" step="0.01" min="0" name="items[{{ $index }}][unit_price]" class="input price-input w-28 text-xs" value="{{ $item['unit_price'] ?? 0 }}" required></td>
                        <td><input type="number" step="0.01" min="0" max="100" name="items[{{ $index }}][tax_rate]" class="input tax-input w-20 text-xs" value="{{ $item['tax_rate'] ?? 20 }}" required></td>
                        <td class="line-total text-right font-semibold">0.00</td>
                        <td>
                            <button type="button" class="btn-ghost remove-line px-2 py-1 text-xs text-red-600" title="Supprimer">✕</button>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-4">
        <div class="w-full max-w-xs space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-muted">Total HT</span><span id="sum-ht" class="font-semibold">0.00</span></div>
            <div class="flex justify-between"><span class="text-muted">TVA</span><span id="sum-tva" class="font-semibold">0.00</span></div>
            <div class="flex justify-between border-t border-slate-200 pt-2 text-base"><span class="font-bold">Total TTC</span><span id="sum-ttc" class="font-extrabold text-brand-700">0.00</span></div>
        </div>
    </div>
</div>
