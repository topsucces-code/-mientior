# 🚀 Guide de Configuration - Mientior Marketplace

## ✅ Ce qui a été fait

1. ✅ **Docker installé** avec Docker Compose V2
2. ✅ **PostgreSQL 16** démarré sur `localhost:5432`
3. ✅ **Redis 7** démarré sur `localhost:6379`
4. ✅ **Schéma Prisma** synchronisé avec la base de données
5. ✅ **Variables d'environnement** configurées dans `.env` et `.env.local`

## 📋 Prochaines étapes

### 1️⃣ Initialiser Better Auth

Better Auth a besoin de créer ses tables dans la base de données. Exécutez :

```bash
node scripts/init-better-auth.js
```

Vous devriez voir :
```
🔌 Connecting to PostgreSQL...
✅ Connected to database
📦 Creating Better Auth tables...
✅ Created "user" table
✅ Created "session" table
✅ Created "account" table
✅ Created "verification" table
✅ Created indexes
🎉 Better Auth tables initialized successfully!
```

### 2️⃣ Redémarrer le serveur Next.js

Après avoir initialisé Better Auth, redémarrez le serveur :

```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis redémarrer
npm run dev
```

### 3️⃣ Vérifier que tout fonctionne

Ouvrez votre navigateur sur `http://localhost:3000`

L'application devrait se charger sans erreurs Better Auth.

## 🐳 Commandes Docker utiles

```bash
# Voir les conteneurs en cours d'exécution
sudo docker compose ps

# Voir les logs
sudo docker compose logs -f

# Voir les logs d'un service spécifique
sudo docker compose logs -f postgres
sudo docker compose logs -f redis

# Arrêter les conteneurs
sudo docker compose down

# Redémarrer les conteneurs
sudo docker compose up -d

# Accéder au shell PostgreSQL
sudo docker exec -it mientior-postgres psql -U mientior -d mientior_db

# Accéder au shell Redis
sudo docker exec -it mientior-redis redis-cli
```

## 🗄️ Commandes Base de Données

### PostgreSQL

```bash
# Se connecter à la base de données
sudo docker exec -it mientior-postgres psql -U mientior -d mientior_db

# Lister les tables
\dt

# Lister les schémas
\dn

# Voir la structure d'une table
\d user

# Quitter
\q
```

### Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Synchroniser le schéma avec la DB
npx prisma db push

# Ouvrir Prisma Studio (GUI pour la DB)
npx prisma studio

# Créer une migration
npx prisma migrate dev --name nom_de_la_migration
```

## 🔧 Variables d'Environnement

Les variables sont dans `.env` et `.env.local` :

- `DATABASE_URL` - PostgreSQL pour Payload CMS (schema public)
- `BETTER_AUTH_DATABASE_URL` - PostgreSQL pour Better Auth (sans schema)
- `PRISMA_DATABASE_URL` - PostgreSQL pour Prisma (schema app)
- `REDIS_URL` - Redis pour le cache
- `PAYLOAD_SECRET` - Secret pour Payload CMS
- `BETTER_AUTH_SECRET` - Secret pour Better Auth
- `REVALIDATION_SECRET` - Secret pour l'API de revalidation

## 🐛 Dépannage

### Erreur "Failed to initialize database adapter"

Cela signifie que Better Auth n'a pas ses tables. Exécutez :

```bash
node scripts/init-better-auth.js
```

### Port déjà utilisé (5432 ou 6379)

Si les ports sont déjà utilisés, modifiez `docker-compose.yml` :

```yaml
ports:
  - "5433:5432"  # Au lieu de "5432:5432"
```

Puis mettez à jour les URLs dans `.env` et `.env.local`.

### Réinitialiser complètement la base de données

```bash
# Arrêter et supprimer les volumes
sudo docker compose down -v

# Redémarrer
sudo docker compose up -d

# Recréer les schémas
sudo docker exec -it mientior-postgres psql -U mientior -d mientior_db -c "CREATE SCHEMA IF NOT EXISTS app;"

# Synchroniser Prisma
npx prisma db push

# Initialiser Better Auth
node scripts/init-better-auth.js
```

## 📚 Documentation

- [Next.js 15](https://nextjs.org/docs)
- [Payload CMS 3.0](https://payloadcms.com/docs)
- [Prisma](https://www.prisma.io/docs)
- [Better Auth](https://www.better-auth.com/docs)
- [Docker Compose](https://docs.docker.com/compose/)

## 🎯 Structure du Projet

```
mientior/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Composants React
│   ├── lib/              # Utilitaires (auth, db, etc.)
│   ├── payload/          # Collections Payload CMS
│   └── stores/           # Zustand stores
├── prisma/
│   └── schema.prisma     # Schéma Prisma
├── scripts/
│   └── init-better-auth.js  # Script d'initialisation
├── docker-compose.yml    # Configuration Docker
├── .env                  # Variables d'environnement (Prisma)
└── .env.local            # Variables d'environnement (Next.js)
```

## ✨ Fonctionnalités

- ✅ Authentification (Better Auth)
- ✅ Gestion de produits (Payload CMS)
- ✅ Panier d'achat (Zustand)
- ✅ Paiement (Stripe - à configurer)
- ✅ Emails (Resend - à configurer)
- ✅ Cache (Redis)
- ✅ Base de données (PostgreSQL + Prisma)

## 🚀 Prêt pour le développement !

Une fois Better Auth initialisé, votre application est prête pour le développement !

Bon codage ! 🎉

