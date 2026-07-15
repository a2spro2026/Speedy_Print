@extends('layouts.app')

@section('title', 'Nouvelle prestation')
@section('page-title', 'Nouvelle prestation')

@section('content')
    <div class="mx-auto max-w-2xl">
        <form method="POST" action="{{ route('products.store') }}" class="card space-y-5 p-5 md:p-6">
            @csrf
            @include('products._form')
            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                <a href="{{ route('products.index') }}" class="btn-secondary">Annuler</a>
                <button type="submit" class="btn-primary">Enregistrer</button>
            </div>
        </form>
    </div>
@endsection
