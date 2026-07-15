@php($client = $client ?? null)

<div class="grid gap-4 md:grid-cols-2">
    <div class="md:col-span-2">
        <label class="label" for="company_name">Raison sociale *</label>
        <input id="company_name" name="company_name" type="text" class="input" value="{{ old('company_name', $client?->company_name) }}" required>
        @error('company_name')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
    </div>
    <div>
        <label class="label" for="contact_name">Contact</label>
        <input id="contact_name" name="contact_name" type="text" class="input" value="{{ old('contact_name', $client?->contact_name) }}">
    </div>
    <div>
        <label class="label" for="email">Email</label>
        <input id="email" name="email" type="email" class="input" value="{{ old('email', $client?->email) }}">
        @error('email')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
    </div>
    <div>
        <label class="label" for="phone">Téléphone</label>
        <input id="phone" name="phone" type="text" class="input" value="{{ old('phone', $client?->phone) }}">
    </div>
    <div>
        <label class="label" for="siret">SIRET</label>
        <input id="siret" name="siret" type="text" class="input" value="{{ old('siret', $client?->siret) }}">
    </div>
    <div class="md:col-span-2">
        <label class="label" for="address">Adresse</label>
        <input id="address" name="address" type="text" class="input" value="{{ old('address', $client?->address) }}">
    </div>
    <div>
        <label class="label" for="postal_code">Code postal</label>
        <input id="postal_code" name="postal_code" type="text" class="input" value="{{ old('postal_code', $client?->postal_code) }}">
    </div>
    <div>
        <label class="label" for="city">Ville</label>
        <input id="city" name="city" type="text" class="input" value="{{ old('city', $client?->city) }}">
    </div>
    <div>
        <label class="label" for="country">Pays</label>
        <input id="country" name="country" type="text" class="input" value="{{ old('country', $client?->country ?? 'France') }}">
    </div>
    <div>
        <label class="label" for="vat_number">N° TVA</label>
        <input id="vat_number" name="vat_number" type="text" class="input" value="{{ old('vat_number', $client?->vat_number) }}">
    </div>
    <div class="md:col-span-2">
        <label class="label" for="notes">Notes</label>
        <textarea id="notes" name="notes" rows="3" class="input">{{ old('notes', $client?->notes) }}</textarea>
    </div>
</div>
