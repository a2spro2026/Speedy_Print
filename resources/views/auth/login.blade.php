<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Connexion — SpeedyPrint</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="relative min-h-screen overflow-hidden font-sans">
    <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('{{ asset('images/login-bg.jpg') }}')"></div>
    <div class="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"></div>

    <div class="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div class="login-glass w-full max-w-[420px] rounded-[28px] px-7 py-8 sm:px-9 sm:py-10">
            <div class="mb-6 text-center">
                <div class="mx-auto mb-4 w-full max-w-[280px]">
                    <x-speedy-logo class="h-16 w-auto" frame="card" :show-slogan="true" />
                </div>
                <p class="mt-1.5 text-sm font-medium text-muted">SpeedyPrint, la solution qui gère</p>
            </div>

            @if($errors->any())
                <div class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {{ $errors->first() }}
                </div>
            @endif

            <form method="POST" action="{{ route('login') }}" class="space-y-4">
                @csrf

                <div>
                    <label for="login" class="label">Email ou Nom d'utilisateur</label>
                    <div class="relative">
                        <span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                            <svg class="h-4.5 w-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        </span>
                        <input
                            id="login"
                            type="text"
                            name="login"
                            value="{{ old('login', 'admin@speedyprint.fr') }}"
                            class="input pl-11"
                            placeholder="exemple@speedyprint.fr"
                            required
                            autofocus
                            autocomplete="username"
                        >
                    </div>
                </div>

                <div>
                    <label for="password" class="label">Mot de passe</label>
                    <div class="relative">
                        <span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                        </span>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            class="input px-11"
                            placeholder="••••••••"
                            required
                            autocomplete="current-password"
                        >
                        <button type="button" id="toggle-password" class="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600" aria-label="Afficher le mot de passe">
                            <svg id="eye-open" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            <svg id="eye-closed" class="hidden" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"/></svg>
                        </button>
                    </div>
                </div>

                <div class="flex items-center justify-between gap-3 text-sm">
                    <label class="inline-flex cursor-pointer items-center gap-2 text-slate-600">
                        <input type="checkbox" name="remember" value="1" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500">
                        Se souvenir de moi
                    </label>
                    <span class="font-medium text-brand-600">Mot de passe oublié</span>
                </div>

                <button type="submit" class="btn-primary w-full py-3 text-base">
                    Connexion
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </button>
            </form>

            <p class="mt-6 text-center text-xs text-muted">Accès sécurisé réservé au personnel.</p>

            <div class="mt-4 flex items-center justify-center gap-6 text-sm text-slate-500">
                <span class="inline-flex items-center gap-1.5">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
                    Français
                </span>
                <span class="inline-flex items-center gap-1.5">
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Support
                </span>
            </div>
        </div>
    </div>

    <div class="pointer-events-none absolute bottom-4 right-5 z-10 text-[11px] font-semibold tracking-[0.14em] text-white/70">
        SPEEDYPRINT ENTERPRISE V4.2
    </div>

    <script>
        const password = document.getElementById('password');
        const toggle = document.getElementById('toggle-password');
        const eyeOpen = document.getElementById('eye-open');
        const eyeClosed = document.getElementById('eye-closed');

        toggle?.addEventListener('click', () => {
            const isHidden = password.type === 'password';
            password.type = isHidden ? 'text' : 'password';
            eyeOpen.classList.toggle('hidden', isHidden);
            eyeClosed.classList.toggle('hidden', !isHidden);
        });
    </script>
</body>
</html>
