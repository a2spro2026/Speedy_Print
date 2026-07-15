@extends('layouts.app')

@section('title', 'Prestations')
@section('page-title', 'Catalogue de prestations')
@section('page-subtitle', 'Produits et services d\'impression')

@section('header-actions')
    <a href="{{ route('products.create') }}" class="btn-primary">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        Nouvelle prestation
    </a>
@endsection

@section('content')
    <form method="GET" class="card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]">
        <input type="search" name="q" value="{{ $search }}" placeholder="Rechercher une prestation..." class="input">
        <select name="category" class="input">
            <option value="">Toutes les catégories</option>
            @foreach($categories as $cat)
                <option value="{{ $cat }}" @selected($category === $cat)>{{ $cat }}</option>
            @endforeach
        </select>
        <button type="submit" class="btn-secondary">Filtrer</button>
    </form>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @forelse($products as $product)
            <div class="card flex flex-col p-5">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="text-xs font-semibold uppercase tracking-wide text-brand-600">{{ $product->category ?? 'Divers' }}</div>
                        <h3 class="mt-1 font-bold text-ink">{{ $product->name }}</h3>
                        @if($product->sku)
                            <div class="mt-1 text-xs text-muted">SKU : {{ $product->sku }}</div>
                        @endif
                    </div>
                    <span class="badge {{ $product->is_active ? 'badge-paid' : 'badge-cancelled' }}">
                        {{ $product->is_active ? 'Actif' : 'Inactif' }}
                    </span>
                </div>
                @if($product->description)
                    <p class="mt-3 line-clamp-2 text-sm text-muted">{{ $product->description }}</p>
                @endif
                <div class="mt-auto flex items-end justify-between pt-5">
                    <div>
                        <div class="text-xl font-extrabold text-brand-700">{{ money($product->unit_price) }}</div>
                        <div class="text-xs text-muted">/ {{ $product->unit }} · TVA {{ number_format($product->tax_rate, 0) }}%</div>
                    </div>
                    <div class="flex gap-1">
                        <a href="{{ route('products.edit', $product) }}" class="btn-ghost px-2 py-1 text-xs">Modifier</a>
                        <form method="POST" action="{{ route('products.destroy', $product) }}" onsubmit="return confirm('Supprimer cette prestation ?')">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="btn-ghost px-2 py-1 text-xs text-red-600">Suppr.</button>
                        </form>
                    </div>
                </div>
            </div>
        @empty
            <div class="card col-span-full py-16 text-center text-muted">Aucune prestation dans le catalogue.</div>
        @endforelse
    </div>

    @if($products->hasPages())
        <div class="mt-5">{{ $products->links() }}</div>
    @endif
@endsection
