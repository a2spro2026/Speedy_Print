@extends('layouts.app')

@section('title', 'Modifier '.$invoice->number)
@section('page-title', 'Modifier — '.$invoice->number)

@section('content')
    <form method="POST" action="{{ route('invoices.update', $invoice) }}" class="space-y-5" id="invoice-form">
        @csrf
        @method('PUT')
        @include('invoices._form')
        <div class="flex flex-wrap justify-end gap-2">
            <a href="{{ route('invoices.show', $invoice) }}" class="btn-secondary">Annuler</a>
            <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
    </form>
@endsection

@push('scripts')
@include('invoices._scripts_body')
@endpush
