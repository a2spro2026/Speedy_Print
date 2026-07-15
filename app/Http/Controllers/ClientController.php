<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ClientController extends Controller
{
    public function index(Request $request): View
    {
        $search = $request->string('q')->trim()->toString();

        $clients = Client::query()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('company_name', 'like', "%{$search}%")
                        ->orWhere('contact_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->withCount('invoices')
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return view('clients.index', compact('clients', 'search'));
    }

    public function create(): View
    {
        return view('clients.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        Client::create($data);

        return redirect()->route('clients.index')->with('success', 'Client créé avec succès.');
    }

    public function show(Client $client): View
    {
        $client->load(['invoices' => fn ($q) => $q->latest()]);

        return view('clients.show', compact('client'));
    }

    public function edit(Client $client): View
    {
        return view('clients.edit', compact('client'));
    }

    public function update(Request $request, Client $client): RedirectResponse
    {
        $client->update($this->validated($request));

        return redirect()->route('clients.show', $client)->with('success', 'Client mis à jour.');
    }

    public function destroy(Client $client): RedirectResponse
    {
        if ($client->invoices()->exists()) {
            return back()->with('error', 'Impossible de supprimer un client ayant des factures.');
        }

        $client->delete();

        return redirect()->route('clients.index')->with('success', 'Client supprimé.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:120'],
            'siret' => ['nullable', 'string', 'max:20'],
            'vat_number' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string'],
        ], [
            'company_name.required' => 'Le nom de l\'entreprise est requis.',
            'email.email' => 'L\'adresse email n\'est pas valide.',
        ]);
    }
}
