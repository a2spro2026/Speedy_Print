@php($product = $product ?? null)

<div class="grid gap-4 md:grid-cols-2">
    <div class="md:col-span-2">
        <label class="label" for="name">Désignation *</label>
        <input id="name" name="name" type="text" class="input" value="{{ old('name', $product?->name) }}" required>
        @error('name')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
    </div>
    <div>
        <label class="label" for="sku">Référence (SKU)</label>
        <input id="sku" name="sku" type="text" class="input" value="{{ old('sku', $product?->sku) }}">
    </div>
    <div>
        <label class="label" for="category">Catégorie</label>
        <input id="category" name="category" type="text" class="input" list="categories" value="{{ old('category', $product?->category) }}" placeholder="Impression, Flyers...">
        <datalist id="categories">
            <option value="Impression">
            <option value="Flyers">
            <option value="Cartes">
            <option value="Brochures">
            <option value="Grand format">
            <option value="Finitions">
        </datalist>
    </div>
    <div>
        <label class="label" for="unit_price">Prix HT *</label>
        <input id="unit_price" name="unit_price" type="number" step="0.01" min="0" class="input" value="{{ old('unit_price', $product?->unit_price) }}" required>
        @error('unit_price')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
    </div>
    <div>
        <label class="label" for="unit">Unité *</label>
        <input id="unit" name="unit" type="text" class="input" value="{{ old('unit', $product?->unit ?? 'unité') }}" required>
    </div>
    <div>
        <label class="label" for="tax_rate">TVA (%) *</label>
        <input id="tax_rate" name="tax_rate" type="number" step="0.01" min="0" max="100" class="input" value="{{ old('tax_rate', $product?->tax_rate ?? 20) }}" required>
    </div>
    <div class="flex items-end">
        <label class="inline-flex items-center gap-2 pb-2.5 text-sm font-medium text-slate-700">
            <input type="checkbox" name="is_active" value="1" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" @checked(old('is_active', $product?->is_active ?? true))>
            Prestation active
        </label>
    </div>
    <div class="md:col-span-2">
        <label class="label" for="description">Description</label>
        <textarea id="description" name="description" rows="3" class="input">{{ old('description', $product?->description) }}</textarea>
    </div>
</div>
