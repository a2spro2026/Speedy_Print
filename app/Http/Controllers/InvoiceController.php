<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class InvoiceController extends Controller
{
    public function index(Request $request): View
    {
        $search = $request->string('q')->trim()->toString();
        $status = $request->string('status')->trim()->toString();

        $invoices = Invoice::query()
            ->with('client')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($c) => $c->where('company_name', 'like', "%{$search}%"));
                });
            })
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return view('invoices.index', [
            'invoices' => $invoices,
            'search' => $search,
            'status' => $status,
            'statuses' => Invoice::STATUSES,
        ]);
    }

    public function create(): View
    {
        return view('invoices.create', [
            'clients' => Client::orderBy('company_name')->get(),
            'products' => Product::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedHeader($request);
        $items = $this->validatedItems($request);

        $invoice = DB::transaction(function () use ($data, $items) {
            $invoice = Invoice::create([
                ...$data,
                'number' => Invoice::generateNumber(),
                'user_id' => Auth::id(),
                'status' => $data['status'] ?? 'draft',
                'subtotal' => 0,
                'tax_amount' => 0,
                'total' => 0,
            ]);

            $this->syncItems($invoice, $items);
            $invoice->recalculateTotals();

            return $invoice;
        });

        return redirect()->route('invoices.show', $invoice)->with('success', 'Facture créée avec succès.');
    }

    public function show(Invoice $invoice): View
    {
        $invoice->load(['client', 'items.product', 'payments', 'user']);

        return view('invoices.show', compact('invoice'));
    }

    public function edit(Invoice $invoice): View
    {
        $invoice->load('items');

        return view('invoices.edit', [
            'invoice' => $invoice,
            'clients' => Client::orderBy('company_name')->get(),
            'products' => Product::where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'paid') {
            return back()->with('error', 'Une facture payée ne peut pas être modifiée.');
        }

        $data = $this->validatedHeader($request);
        $items = $this->validatedItems($request);

        DB::transaction(function () use ($invoice, $data, $items) {
            $invoice->update($data);
            $invoice->items()->delete();
            $this->syncItems($invoice, $items);
            $invoice->recalculateTotals();
            $invoice->syncPaymentStatus();
        });

        return redirect()->route('invoices.show', $invoice)->with('success', 'Facture mise à jour.');
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'paid') {
            return back()->with('error', 'Impossible de supprimer une facture payée.');
        }

        $invoice->delete();

        return redirect()->route('invoices.index')->with('success', 'Facture supprimée.');
    }

    public function markSent(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'draft') {
            $invoice->update(['status' => $invoice->due_date->isPast() ? 'overdue' : 'sent']);
        }

        return back()->with('success', 'Facture marquée comme envoyée.');
    }

    public function storePayment(Request $request, Invoice $invoice): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'in:'.implode(',', array_keys(Payment::METHODS))],
            'paid_at' => ['required', 'date'],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
        ]);

        if ((float) $data['amount'] > $invoice->balance + 0.01) {
            return back()->with('error', 'Le montant dépasse le solde restant ('.money($invoice->balance).').');
        }

        $invoice->payments()->create($data);
        $invoice->syncPaymentStatus();

        return back()->with('success', 'Paiement enregistré.');
    }

    public function print(Invoice $invoice): View
    {
        $invoice->load(['client', 'items', 'payments']);

        return view('invoices.print', compact('invoice'));
    }

    private function validatedHeader(Request $request): array
    {
        return $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'status' => ['nullable', 'in:draft,sent,cancelled'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
        ], [
            'client_id.required' => 'Sélectionnez un client.',
            'due_date.after_or_equal' => 'La date d\'échéance doit être postérieure ou égale à la date d\'émission.',
        ]);
    }

    private function validatedItems(Request $request): array
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['required', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ], [
            'items.required' => 'Ajoutez au moins une ligne de facturation.',
            'items.*.description.required' => 'La description de chaque ligne est requise.',
        ]);

        return $data['items'];
    }

    private function syncItems(Invoice $invoice, array $items): void
    {
        foreach ($items as $item) {
            $qty = (float) $item['quantity'];
            $price = (float) $item['unit_price'];

            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'product_id' => $item['product_id'] ?: null,
                'description' => $item['description'],
                'quantity' => $qty,
                'unit' => $item['unit'],
                'unit_price' => $price,
                'tax_rate' => $item['tax_rate'],
                'line_total' => round($qty * $price, 2),
            ]);
        }
    }
}
