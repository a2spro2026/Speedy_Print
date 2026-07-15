@extends('layouts.app')

@section('title', 'Nouveau client')
@section('page-title', 'Nouveau client')

@section('content')
    <div class="mx-auto max-w-3xl">
        <form method="POST" action="{{ route('clients.store') }}" class="card space-y-5 p-5 md:p-6">
            @csrf
            @include('clients._form')
            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                <a href="{{ route('clients.index') }}" class="btn-secondary">Annuler</a>
                <button type="submit" class="btn-primary">Enregistrer</button>
            </div>
        </form>
    </div>
@endsection
