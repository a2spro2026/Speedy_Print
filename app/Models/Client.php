<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = [
        'company_name',
        'contact_name',
        'email',
        'phone',
        'address',
        'city',
        'postal_code',
        'country',
        'siret',
        'vat_number',
        'notes',
    ];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->company_name;
    }

    public function getFullAddressAttribute(): string
    {
        return collect([
            $this->address,
            trim(($this->postal_code ?? '').' '.($this->city ?? '')),
            $this->country,
        ])->filter()->implode(', ');
    }
}
