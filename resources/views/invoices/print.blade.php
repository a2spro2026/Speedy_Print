<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Facture {{ $invoice->number }} — SpeedyPrint</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; background: #f4f7fb; }
        .sheet { max-width: 900px; margin: 24px auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(15,23,42,.08); }
        .toolbar { max-width: 900px; margin: 16px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
        .btn { border: 0; border-radius: 10px; padding: 10px 16px; font-weight: 600; cursor: pointer; text-decoration: none; font-size: 14px; }
        .btn-primary { background: #1e56d9; color: white; }
        .btn-secondary { background: white; color: #1e293b; border: 1px solid #e2e8f0; }
        .header { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 36px; }
        .brand { display: flex; gap: 12px; align-items: center; }
        .logo { width: 48px; height: 48px; background: #eff6ff; border-radius: 12px; display: grid; place-items: center; }
        .brand h1 { margin: 0; font-size: 22px; color: #1a45b0; }
        .brand p { margin: 2px 0 0; font-size: 12px; color: #64748b; }
        .meta { text-align: right; }
        .meta h2 { margin: 0; font-size: 28px; letter-spacing: -.02em; }
        .badge { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #dbeafe; color: #1d4ed8; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; font-weight: 700; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; padding: 10px 8px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: top; }
        .right { text-align: right; }
        .totals { margin-left: auto; width: 280px; margin-top: 20px; }
        .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
        .totals .grand { border-top: 2px solid #e2e8f0; margin-top: 8px; padding-top: 12px; font-size: 18px; font-weight: 800; color: #1a45b0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
        @media print {
            body { background: white; }
            .toolbar { display: none !important; }
            .sheet { box-shadow: none; margin: 0; max-width: none; border-radius: 0; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="toolbar no-print">
        <a class="btn btn-secondary" href="{{ route('invoices.show', $invoice) }}">Retour</a>
        <button class="btn btn-primary" onclick="window.print()">Imprimer / PDF</button>
    </div>

    <div class="sheet">
        <div class="header">
            <div class="brand">
                <img src="{{ asset('images/logo-speedyprint.png') }}" alt="Speedy Print" style="height:56px;width:auto;object-fit:contain;">
                <div>
                    <p>Imprimerie professionnelle<br>contact@speedyprint.fr · 01 23 45 67 89</p>
                </div>
            </div>
            <div class="meta">
                <h2>FACTURE</h2>
                <div><strong>{{ $invoice->number }}</strong></div>
                <span class="badge">{{ $invoice->status_label }}</span>
            </div>
        </div>

        <div class="grid">
            <div>
                <div class="label">Facturé à</div>
                <strong>{{ $invoice->client->company_name }}</strong><br>
                @if($invoice->client->contact_name){{ $invoice->client->contact_name }}<br>@endif
                {{ $invoice->client->address }}<br>
                {{ $invoice->client->postal_code }} {{ $invoice->client->city }}<br>
                @if($invoice->client->siret)SIRET : {{ $invoice->client->siret }}@endif
            </div>
            <div style="text-align:right">
                <div class="label">Informations</div>
                Date d'émission : <strong>{{ $invoice->issue_date->format('d/m/Y') }}</strong><br>
                Date d'échéance : <strong>{{ $invoice->due_date->format('d/m/Y') }}</strong><br>
                @if($invoice->client->email)Email : {{ $invoice->client->email }}@endif
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Qté</th>
                    <th>Unité</th>
                    <th class="right">P.U. HT</th>
                    <th class="right">TVA</th>
                    <th class="right">Total HT</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->items as $item)
                    <tr>
                        <td>{{ $item->description }}</td>
                        <td>{{ number_format($item->quantity, 2, ',', ' ') }}</td>
                        <td>{{ $item->unit }}</td>
                        <td class="right">{{ money($item->unit_price) }}</td>
                        <td class="right">{{ number_format($item->tax_rate, 0) }}%</td>
                        <td class="right">{{ money($item->line_ht) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <div><span>Total HT</span><span>{{ money($invoice->subtotal) }}</span></div>
            <div><span>TVA</span><span>{{ money($invoice->tax_amount) }}</span></div>
            <div class="grand"><span>Total TTC</span><span>{{ money($invoice->total) }}</span></div>
            @if($invoice->amount_paid > 0)
                <div><span>Payé</span><span>{{ money($invoice->amount_paid) }}</span></div>
                <div><span>Reste dû</span><span>{{ money($invoice->balance) }}</span></div>
            @endif
        </div>

        <div class="footer">
            @if($invoice->notes)<p><strong>Notes :</strong> {{ $invoice->notes }}</p>@endif
            @if($invoice->terms)<p><strong>Conditions :</strong> {{ $invoice->terms }}</p>@endif
            <p>SpeedyPrint — Merci pour votre confiance.</p>
        </div>
    </div>
</body>
</html>
