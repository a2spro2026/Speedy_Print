@extends('layouts.app')

@section('title', 'Modifier le client')
@section('page-title', 'Modifier — '.$client->company_name)

@section('content')
    <div class="mx-auto max-w-3xl">
        <form method="POST" action="{{ route('clients.update', $client) }}" class="card space-y-5 p-5 md:p-6">
            @csrf
            @method('PUT')
            @include('clients._form')
            <div class="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                <a href="{{ route('clients.show', $client) }}" class="btn-secondary">Annuler</a>
                <button type="submit" class="btn-primary">Mettre à jour</button>
            </div>
        </form>
    </div>
@endsection
