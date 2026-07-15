<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@speedyprint.fr'],
            [
                'name' => 'Admin SpeedyPrint',
                'password' => Hash::make('password'),
            ]
        );

        $products = [
            ['name' => 'Impression A4 couleur', 'sku' => 'IMP-A4-C', 'category' => 'Impression', 'unit_price' => 0.15, 'unit' => 'page', 'tax_rate' => 20],
            ['name' => 'Impression A4 N&B', 'sku' => 'IMP-A4-NB', 'category' => 'Impression', 'unit_price' => 0.05, 'unit' => 'page', 'tax_rate' => 20],
            ['name' => 'Flyer A5 (1000 ex.)', 'sku' => 'FLY-A5-1K', 'category' => 'Flyers', 'unit_price' => 89.00, 'unit' => 'lot', 'tax_rate' => 20],
            ['name' => 'Carte de visite (500 ex.)', 'sku' => 'CDV-500', 'category' => 'Cartes', 'unit_price' => 45.00, 'unit' => 'lot', 'tax_rate' => 20],
            ['name' => 'Kakémono 85×200', 'sku' => 'KAK-85', 'category' => 'Grand format', 'unit_price' => 79.00, 'unit' => 'unité', 'tax_rate' => 20],
            ['name' => 'Brochure 16 pages A4', 'sku' => 'BRO-16', 'category' => 'Brochures', 'unit_price' => 3.50, 'unit' => 'exemplaire', 'tax_rate' => 20],
            ['name' => 'Reliure spirale', 'sku' => 'REL-SPI', 'category' => 'Finitions', 'unit_price' => 2.50, 'unit' => 'unité', 'tax_rate' => 20],
            ['name' => 'Plastification A4', 'sku' => 'PLA-A4', 'category' => 'Finitions', 'unit_price' => 1.80, 'unit' => 'page', 'tax_rate' => 20],
        ];

        foreach ($products as $product) {
            Product::updateOrCreate(['sku' => $product['sku']], $product + ['is_active' => true]);
        }

        $clients = [
            [
                'company_name' => 'Agence Nova Com',
                'contact_name' => 'Sophie Martin',
                'email' => 'sophie@novacom.fr',
                'phone' => '01 45 67 89 01',
                'address' => '12 rue de la République',
                'city' => 'Lyon',
                'postal_code' => '69002',
                'siret' => '12345678900012',
            ],
            [
                'company_name' => 'Boulangerie Dupont',
                'contact_name' => 'Marc Dupont',
                'email' => 'contact@boulangerie-dupont.fr',
                'phone' => '04 78 12 34 56',
                'address' => '8 avenue Victor Hugo',
                'city' => 'Villeurbanne',
                'postal_code' => '69100',
            ],
            [
                'company_name' => 'Tech Solutions SARL',
                'contact_name' => 'Amine Benali',
                'email' => 'a.benali@techsolutions.fr',
                'phone' => '06 12 34 56 78',
                'address' => '45 boulevard des Belges',
                'city' => 'Lyon',
                'postal_code' => '69006',
                'vat_number' => 'FR12345678901',
            ],
            [
                'company_name' => 'Mairie de Caluire',
                'contact_name' => 'Service Communication',
                'email' => 'com@ville-caluire.fr',
                'phone' => '04 72 00 11 22',
                'address' => 'Place du Docteur Frédéric Dugoujon',
                'city' => 'Caluire-et-Cuire',
                'postal_code' => '69300',
            ],
        ];

        foreach ($clients as $clientData) {
            Client::updateOrCreate(
                ['email' => $clientData['email']],
                $clientData + ['country' => 'France']
            );
        }

        $catalog = Product::all();
        $clientModels = Client::all();

        if (Invoice::count() === 0) {
            $samples = [
                ['status' => 'paid', 'days_ago' => 25, 'due_days' => 15],
                ['status' => 'sent', 'days_ago' => 5, 'due_days' => 30],
                ['status' => 'overdue', 'days_ago' => 40, 'due_days' => 15],
                ['status' => 'draft', 'days_ago' => 1, 'due_days' => 30],
                ['status' => 'partial', 'days_ago' => 12, 'due_days' => 30],
            ];

            foreach ($samples as $i => $sample) {
                $client = $clientModels[$i % $clientModels->count()];
                $issue = now()->subDays($sample['days_ago']);
                $due = $issue->copy()->addDays($sample['due_days']);

                $invoice = Invoice::create([
                    'number' => Invoice::generateNumber(),
                    'client_id' => $client->id,
                    'user_id' => $admin->id,
                    'status' => 'draft',
                    'issue_date' => $issue,
                    'due_date' => $due,
                    'notes' => 'Merci pour votre confiance.',
                    'terms' => 'Paiement à 30 jours. Pénalités de retard : 3× le taux légal.',
                    'subtotal' => 0,
                    'tax_amount' => 0,
                    'total' => 0,
                ]);

                $selected = $catalog->random(rand(2, 4));
                foreach ($selected as $product) {
                    $qty = $product->unit === 'page' ? rand(100, 2000) : rand(1, 10);
                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'product_id' => $product->id,
                        'description' => $product->name,
                        'quantity' => $qty,
                        'unit' => $product->unit,
                        'unit_price' => $product->unit_price,
                        'tax_rate' => $product->tax_rate,
                        'line_total' => round($qty * (float) $product->unit_price, 2),
                    ]);
                }

                $invoice->load('items');
                $invoice->recalculateTotals();
                $invoice->refresh();

                if ($sample['status'] === 'paid') {
                    Payment::create([
                        'invoice_id' => $invoice->id,
                        'amount' => $invoice->total,
                        'method' => 'virement',
                        'paid_at' => $due->copy()->subDays(2),
                        'reference' => 'VIR-'.strtoupper(substr(md5($invoice->number), 0, 8)),
                    ]);
                    $invoice->syncPaymentStatus();
                } elseif ($sample['status'] === 'partial') {
                    Payment::create([
                        'invoice_id' => $invoice->id,
                        'amount' => round((float) $invoice->total / 2, 2),
                        'method' => 'cheque',
                        'paid_at' => now()->subDays(3),
                        'reference' => 'CHQ-'.rand(1000, 9999),
                    ]);
                    $invoice->update(['status' => 'sent']);
                    $invoice->syncPaymentStatus();
                } elseif ($sample['status'] === 'overdue') {
                    $invoice->update(['status' => 'overdue']);
                } elseif ($sample['status'] === 'sent') {
                    $invoice->update(['status' => 'sent']);
                }
            }
        }
    }
}
