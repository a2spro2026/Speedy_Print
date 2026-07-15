<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'number',
        'client_id',
        'user_id',
        'status',
        'issue_date',
        'due_date',
        'subtotal',
        'tax_amount',
        'total',
        'amount_paid',
        'notes',
        'terms',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
        ];
    }

    public const STATUSES = [
        'draft' => 'Brouillon',
        'sent' => 'Envoyée',
        'paid' => 'Payée',
        'partial' => 'Partielle',
        'overdue' => 'En retard',
        'cancelled' => 'Annulée',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    public function getBalanceAttribute(): float
    {
        return max(0, (float) $this->total - (float) $this->amount_paid);
    }

    public function recalculateTotals(): void
    {
        $subtotal = 0;
        $tax = 0;

        foreach ($this->items as $item) {
            $lineHt = (float) $item->quantity * (float) $item->unit_price;
            $subtotal += $lineHt;
            $tax += $lineHt * ((float) $item->tax_rate / 100);
        }

        $this->update([
            'subtotal' => round($subtotal, 2),
            'tax_amount' => round($tax, 2),
            'total' => round($subtotal + $tax, 2),
        ]);
    }

    public function syncPaymentStatus(): void
    {
        $paid = (float) $this->payments()->sum('amount');
        $this->amount_paid = $paid;

        if ($this->status === 'cancelled') {
            $this->save();
            return;
        }

        if ($paid <= 0) {
            if ($this->status !== 'draft' && $this->due_date->isPast()) {
                $this->status = 'overdue';
            } elseif ($this->status !== 'draft') {
                $this->status = 'sent';
            }
            $this->paid_at = null;
        } elseif ($paid >= (float) $this->total) {
            $this->status = 'paid';
            $this->paid_at = now();
        } else {
            $this->status = 'partial';
            $this->paid_at = null;
        }

        $this->save();
    }

    public static function generateNumber(): string
    {
        $year = now()->format('Y');
        $prefix = 'FAC-'.$year.'-';
        $last = static::where('number', 'like', $prefix.'%')
            ->orderByDesc('number')
            ->value('number');

        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
