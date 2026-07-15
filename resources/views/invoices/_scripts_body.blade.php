<script>
(function () {
    const body = document.getElementById('lines-body');
    const addBtn = document.getElementById('add-line');
    if (!body || !addBtn) return;

    const products = @json($products->map(fn ($p) => [
        'id' => $p->id,
        'name' => $p->name,
        'unit_price' => (float) $p->unit_price,
        'unit' => $p->unit,
        'tax_rate' => (float) $p->tax_rate,
    ])->values());

    function productOptionsHtml(selectedId) {
        return products.map(p =>
            `<option value="${p.id}" data-name="${p.name.replace(/"/g, '&quot;')}" data-price="${p.unit_price}" data-unit="${p.unit}" data-tax="${p.tax_rate}" ${String(selectedId) === String(p.id) ? 'selected' : ''}>${p.name}</option>`
        ).join('');
    }

    function formatMoney(n) {
        const fixed = Math.abs(n).toFixed(2);
        const [intPart, decPart] = fixed.split('.');
        const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return (n < 0 ? '-' : '') + grouped + '.' + decPart;
    }

    function recalc() {
        let ht = 0, tva = 0;
        body.querySelectorAll('.line-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            const tax = parseFloat(row.querySelector('.tax-input').value) || 0;
            const lineHt = qty * price;
            ht += lineHt;
            tva += lineHt * (tax / 100);
            row.querySelector('.line-total').textContent = formatMoney(lineHt);
        });
        document.getElementById('sum-ht').textContent = formatMoney(ht);
        document.getElementById('sum-tva').textContent = formatMoney(tva);
        document.getElementById('sum-ttc').textContent = formatMoney(ht + tva);
    }

    function bindRow(row) {
        row.querySelector('.product-select')?.addEventListener('change', function () {
            const opt = this.selectedOptions[0];
            if (!opt || !opt.value) return;
            row.querySelector('.desc-input').value = opt.dataset.name || '';
            row.querySelector('.price-input').value = opt.dataset.price || '0';
            row.querySelector('.unit-input').value = opt.dataset.unit || 'unité';
            row.querySelector('.tax-input').value = opt.dataset.tax || '20';
            recalc();
        });
        row.querySelectorAll('.qty-input, .price-input, .tax-input').forEach(el => el.addEventListener('input', recalc));
        row.querySelector('.remove-line')?.addEventListener('click', () => {
            if (body.querySelectorAll('.line-row').length <= 1) return;
            row.remove();
            recalc();
        });
    }

    addBtn.addEventListener('click', () => {
        const i = Date.now();
        const tr = document.createElement('tr');
        tr.className = 'line-row';
        tr.innerHTML = `
            <td><select name="items[${i}][product_id]" class="input product-select text-xs"><option value="">Libre</option>${productOptionsHtml('')}</select></td>
            <td><input type="text" name="items[${i}][description]" class="input text-xs desc-input" required></td>
            <td><input type="number" step="0.01" min="0.01" name="items[${i}][quantity]" class="input qty-input w-20 text-xs" value="1" required></td>
            <td><input type="text" name="items[${i}][unit]" class="input unit-input w-24 text-xs" value="unité" required></td>
            <td><input type="number" step="0.01" min="0" name="items[${i}][unit_price]" class="input price-input w-28 text-xs" value="0" required></td>
            <td><input type="number" step="0.01" min="0" max="100" name="items[${i}][tax_rate]" class="input tax-input w-20 text-xs" value="20" required></td>
            <td class="line-total text-right font-semibold">0.00</td>
            <td><button type="button" class="btn-ghost remove-line px-2 py-1 text-xs text-red-600">✕</button></td>
        `;
        body.appendChild(tr);
        bindRow(tr);
        recalc();
    });

    body.querySelectorAll('.line-row').forEach(bindRow);
    recalc();
})();
</script>
