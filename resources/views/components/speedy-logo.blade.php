@props([
    'class' => 'h-14 w-auto',
    'alt' => 'Speedy Print — La Qualité et la Rapidité au Meilleur prix',
    'frame' => 'card',
    'showSlogan' => false,
])

@if($frame === 'none')
    <img
        src="{{ asset('images/logo-speedyprint.png') }}"
        alt="{{ $alt }}"
        {{ $attributes->merge(['class' => 'mx-auto object-contain '.$class]) }}
    >
@else
    <div {{ $attributes->merge(['class' => 'w-full']) }}>
        <div
            class="relative rounded-[22px] p-px"
            style="background: linear-gradient(135deg, #2563EB 0%, #EC4899 35%, #F59E0B 65%, #06B6D4 100%); box-shadow: 0 0 18px rgba(37,99,235,0.55), 0 0 36px rgba(236,72,153,0.35), 0 0 52px rgba(245,158,11,0.25), 0 14px 40px rgba(15,23,42,0.2);"
        >
            <div
                class="pointer-events-none absolute -inset-1 rounded-[24px] opacity-70 blur-md"
                style="background: linear-gradient(135deg, rgba(37,99,235,0.55), rgba(236,72,153,0.45), rgba(245,158,11,0.4), rgba(6,182,212,0.45));"
                aria-hidden="true"
            ></div>
            <div class="relative overflow-hidden rounded-[21px] bg-white px-4 py-3.5 sm:px-5 sm:py-4">
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-amber-50/60" aria-hidden="true"></div>
                <div class="relative flex flex-col items-center gap-1.5">
                    <img
                        src="{{ asset('images/logo-speedyprint.png') }}"
                        alt="{{ $alt }}"
                        class="mx-auto object-contain {{ $class }}"
                    >
                    @if($showSlogan)
                        <p class="max-w-[240px] text-center text-[10px] font-semibold leading-snug tracking-wide text-slate-500">
                            La Qualité et la Rapidité au Meilleur prix
                        </p>
                    @endif
                </div>
            </div>
        </div>
    </div>
@endif
