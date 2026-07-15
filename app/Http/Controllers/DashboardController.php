<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        $stats = [
            'clients' => Client::count(),
            'products' => Product::where('is_active', true)->count(),
            'invoices' => Invoice::whereNotIn('status', ['cancelled'])->count(),
            'revenue' => Invoice::where('status', 'paid')->sum('total'),
            'pending' => Invoice::whereIn('status', ['sent', 'partial', 'overdue'])->sum(DB::raw('total - amount_paid')),
            'overdue' => Invoice::where('status', 'overdue')->count(),
        ];

        $recentInvoices = Invoice::with('client')
            ->latest()
            ->limit(8)
            ->get();

        $recentPayments = Payment::with('invoice.client')
            ->latest('paid_at')
            ->limit(5)
            ->get();

        $monthlyRevenue = Invoice::query()
            ->where('status', 'paid')
            ->whereYear('issue_date', now()->year)
            ->selectRaw('MONTH(issue_date) as month, SUM(total) as total')
            ->groupBy('month')
            ->pluck('total', 'month');

        return view('dashboard.index', compact('stats', 'recentInvoices', 'recentPayments', 'monthlyRevenue'));
    }
}
