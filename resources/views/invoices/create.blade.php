@extends('layouts.app')

@section('title', 'Nouvelle facture')
@section('page-title', 'Nouvelle facture')

@section('content')
    <form method="POST" action="{{ route('invoices.store') }}" class="space-y-5" id="invoice-form">
        @csrf
        @include('invoices._form', ['invoice' => null])
        <div class="flex flex-wrap justify-end gap-2">
            <a href="{{ route('invoices.index') }}" class="btn-secondary">Annuler</a>
            <button type="submit" class="btn-primary">Créer la facture</button>
        </div>
    </form>
@endsection

@push('scripts')
@include('invoices._scripts_body')
@endpush
