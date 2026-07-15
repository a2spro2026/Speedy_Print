<?php

if (! function_exists('money')) {
    /**
     * Format monétaire SpeedyPrint : sans devise, décimales en .00
     * Exemple : 8240 → "8 240.00"
     */
    function money(mixed $value): string
    {
        return number_format((float) $value, 2, '.', ' ');
    }
}
