# SpeedyPrint

Application de facturation / gestion imprimerie.

## Ouvrir l’app (IMPORTANT)

| Environnement | URL |
|---------------|-----|
| **Local (seul lien valide)** | **http://127.0.0.1:3000** |
| Production | https://speedyprint.a2spr.com |

**Interdit :** ne jamais lancer `php artisan serve` ni ouvrir `:6500` / `:8000` / `:8001` / `:8080` — ce n’est pas SpeedyPrint.

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

- **UI** : Next.js 15 (`frontend/`) — seul point d’entrée local : **http://127.0.0.1:3000**
- **API / backend** : Laravel 12 (racine), pas pour l’interface
