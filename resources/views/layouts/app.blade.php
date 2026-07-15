<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'SpeedyPrint') — Gestion</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen">
    <div class="flex min-h-screen">
        <div id="sidebar-overlay" class="fixed inset-0 z-40 hidden bg-slate-900/50 lg:hidden"></div>

        <aside id="sidebar" class="fixed inset-y-0 left-0 z-50 flex w-[280px] -translate-x-full flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-[#0b1220] text-white shadow-[8px_0_40px_rgba(15,23,42,0.25)] transition-transform duration-300 lg:static lg:translate-x-0">
            <div class="pointer-events-none absolute -left-16 top-24 h-40 w-40 rounded-full bg-brand-500/30 blur-3xl"></div>
            <div class="pointer-events-none absolute -right-10 bottom-28 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl"></div>

            <div class="relative z-10 border-b border-white/10 px-4 py-4">
                <x-speedy-logo class="h-14 w-auto" frame="card" />
            </div>

            <nav class="relative z-10 flex-1 space-y-2 overflow-y-auto px-3 py-4">
                <a href="{{ route('dashboard') }}"
                   class="group relative mb-3 flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300
                   {{ request()->routeIs('dashboard')
                        ? 'bg-gradient-to-r from-brand-600 via-blue-500 to-violet-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.45)] ring-1 ring-white/20'
                        : 'bg-white/5 text-white/85 ring-1 ring-white/10 hover:bg-white/10' }}">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl {{ request()->routeIs('dashboard') ? 'bg-white/20' : 'bg-gradient-to-br from-brand-600 to-violet-600' }}">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-4 0h4"/></svg>
                    </span>
                    <span class="flex-1 leading-tight">
                        Tableau de bord
                        <span class="mt-0.5 block text-[11px] font-medium opacity-75">Vue d'ensemble</span>
                    </span>
                    @if(request()->routeIs('dashboard'))
                        <span class="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]"></span>
                    @endif
                </a>

                <div class="px-1 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Modules</div>

                @php
                    $menus = [
                        [
                            'id' => 'fournisseurs',
                            'label' => 'Fournisseur',
                            'accent' => 'from-violet-500 to-purple-600',
                            'active' => false,
                            'items' => [
                                ['label' => 'Fiche Fournisseur', 'url' => '#'],
                                ['label' => 'Facture Achat', 'url' => '#'],
                                ['label' => 'Règlement', 'url' => '#'],
                                ['label' => 'Balance', 'url' => '#'],
                            ],
                        ],
                        [
                            'id' => 'clients',
                            'label' => 'Client',
                            'accent' => 'from-sky-500 to-blue-600',
                            'active' => request()->routeIs('clients.*'),
                            'items' => [
                                ['label' => 'Fiche Client', 'url' => route('clients.index')],
                                ['label' => 'Devis', 'url' => route('invoices.index')],
                                ['label' => 'Facture Vente', 'url' => route('invoices.index')],
                                ['label' => 'Règlement', 'url' => route('invoices.index')],
                                ['label' => 'Balance', 'url' => route('clients.index')],
                            ],
                        ],
                        [
                            'id' => 'stock',
                            'label' => 'Gestion Stock',
                            'accent' => 'from-amber-500 to-orange-600',
                            'active' => request()->routeIs('products.*'),
                            'items' => [
                                ['label' => 'Fiche Produit', 'url' => route('products.index')],
                                ['label' => 'Balance Stock', 'url' => route('products.index')],
                                ['label' => 'Mouvement Stock', 'url' => route('products.index')],
                            ],
                        ],
                        [
                            'id' => 'charges',
                            'label' => 'Charge',
                            'accent' => 'from-rose-500 to-pink-600',
                            'active' => false,
                            'items' => [
                                ['label' => 'Charge', 'url' => '#'],
                                ['label' => 'Balance Charge', 'url' => '#'],
                            ],
                        ],
                        [
                            'id' => 'tresorerie',
                            'label' => 'Trésorerie',
                            'accent' => 'from-emerald-500 to-teal-600',
                            'active' => false,
                            'items' => [
                                ['label' => 'Caisse', 'url' => '#'],
                                ['label' => 'Banque', 'url' => '#'],
                            ],
                        ],
                        [
                            'id' => 'config',
                            'label' => 'Configuration',
                            'accent' => 'from-slate-500 to-slate-700',
                            'active' => false,
                            'items' => [
                                ['label' => 'Utilisateur', 'url' => '#'],
                            ],
                        ],
                    ];
                @endphp

                @foreach($menus as $menu)
                    <div class="nav-group rounded-2xl {{ $menu['active'] ? 'bg-white/[0.04] ring-1 ring-white/10' : '' }}" data-group="{{ $menu['id'] }}">
                        <button type="button" class="nav-group-toggle flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-white/75 transition hover:bg-white/5 hover:text-white" aria-expanded="{{ $menu['active'] ? 'true' : 'false' }}">
                            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br {{ $menu['accent'] }} text-white shadow-md">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="7"/></svg>
                            </span>
                            <span class="flex-1">{{ $menu['label'] }}</span>
                            <svg class="nav-chevron h-4 w-4 text-white/50 transition-transform duration-300 {{ $menu['active'] ? 'rotate-180' : '' }}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div class="nav-group-panel space-y-1 px-2 pb-2 pt-1 {{ $menu['active'] ? '' : 'hidden' }}">
                            @foreach($menu['items'] as $item)
                                <a href="{{ $item['url'] }}" class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-white/65 transition hover:bg-white/8 hover:text-white">
                                    <span class="h-1.5 w-1.5 rounded-full bg-white/40"></span>
                                    {{ $item['label'] }}
                                </a>
                            @endforeach
                        </div>
                    </div>
                @endforeach
            </nav>

            <div class="relative z-10 border-t border-white/10 p-4">
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-rose-400/30 hover:bg-rose-500/20 hover:text-white">
                        Déconnexion
                    </button>
                </form>
            </div>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
            <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div class="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
                    <div class="flex min-w-0 items-center gap-3">
                        <button type="button" id="sidebar-toggle" class="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden" aria-label="Menu">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                        </button>
                        <div class="min-w-0">
                            <div class="flex items-center gap-2">
                                <h1 class="truncate text-lg font-extrabold tracking-tight text-ink md:text-xl">@yield('page-title', 'Tableau de bord')</h1>
                                <span class="hidden rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 sm:inline">Live</span>
                            </div>
                            @hasSection('page-subtitle')
                                <p class="truncate text-sm text-muted">@yield('page-subtitle')</p>
                            @endif
                        </div>
                    </div>
                    <div class="flex items-center gap-2 sm:gap-3">
                        @yield('header-actions')
                        <div class="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white py-1.5 pl-1.5 pr-3 shadow-sm ring-1 ring-slate-100">
                            <img
                                src="{{ asset('images/khalid.jpg') }}"
                                alt="MR KAHLID"
                                class="h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-brand-300/50"
                                onerror="this.src='https://ui-avatars.com/api/?name=Kahlid&background=2563EB&color=fff'"
                            >
                            <div class="min-w-0 leading-tight">
                                <div class="truncate text-sm font-extrabold tracking-wide text-ink">MR KAHLID</div>
                                <div class="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">Administrateur</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main class="flex-1 p-4 md:p-6">
                @if(session('success'))
                    <div class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{{ session('success') }}</div>
                @endif
                @if(session('error'))
                    <div class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{{ session('error') }}</div>
                @endif
                @yield('content')
            </main>
        </div>
    </div>

    <script>
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const toggle = document.getElementById('sidebar-toggle');

        toggle?.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        });
        overlay?.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });

        document.querySelectorAll('.nav-group-toggle').forEach((btn) => {
            btn.addEventListener('click', () => {
                const group = btn.closest('.nav-group');
                const panel = group.querySelector('.nav-group-panel');
                const chevron = group.querySelector('.nav-chevron');
                const open = panel.classList.toggle('hidden') === false;
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                chevron.classList.toggle('rotate-180', open);
                group.classList.toggle('bg-white/[0.04]', open);
                group.classList.toggle('ring-1', open);
                group.classList.toggle('ring-white/10', open);
            });
        });
    </script>
    @stack('scripts')
</body>
</html>
