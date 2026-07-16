# SpeedyPrint

Application de facturation / gestion imprimerie.

## Ouvrir l’app (IMPORTANT)

| Environnement | URL |
|---------------|-----|
| **Local (seul lien valide)** | **http://127.0.0.1:3000** |
| Production | https://speedyprint.a2spr.com |

**Ne jamais ouvrir** `:6500`, `:8000`, `:8001`, `:8080` — ce sont d’anciennes UI Laravel / Vite, pas SpeedyPrint.

## Démarrer en local

```bash
cd frontend
npm install
npm run dev -- --port 3000 --hostname 127.0.0.1
```

Ou depuis la racine :

```bash
npm run dev
# ou: composer run dev
```

Compte démo : `admin@speedyprint.fr` / `password`

## Stack

- **UI** : Next.js 15 (`frontend/`)
- **API / backend** : Laravel 12 (racine) — optionnel en local via `composer run dev:api` (API seule, pas l’UI)
