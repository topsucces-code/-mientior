# Guide de Configuration de l'Authentification

## ✅ Ce qui a été implémenté

### Pages d'authentification
- **`/login`** - Connexion avec email/password
- **`/register`** - Inscription utilisateur
- **`/forgot-password`** - Demande de réinitialisation du mot de passe
- **`/reset-password`** - Réinitialisation avec token

### Infrastructure
- **Better Auth** avec Prisma adapter
- **useAuth hook** pour la gestion de session côté client
- **API routes** à `/api/auth/[...auth]`
- **Intégration Header** - Affiche "Connexion" ou profil utilisateur

## 🚨 Configuration Requise

### 1. Démarrer PostgreSQL

Assurez-vous que PostgreSQL est démarré et accessible :

```bash
# Vérifier si PostgreSQL est en cours d'exécution
sudo systemctl status postgresql

# Si non démarré, le démarrer
sudo systemctl start postgresql
```

### 2. Appliquer les Migrations de Base de Données

Les modèles Better Auth ont été ajoutés au schéma Prisma. Vous devez les appliquer :

```bash
# Option 1: Push direct (recommandé pour le développement)
npx prisma db push

# Option 2: Migration nommée (recommandé pour la production)
npx prisma migrate dev --name add_better_auth_models

# Générer le client Prisma
npx prisma generate
```

### 3. Vérifier les Variables d'Environnement

Assurez-vous que `.env.local` contient :

```env
# Database
PRISMA_DATABASE_URL="postgresql://mientior:mientior_password_2024@localhost:5432/mientior_db?schema=app"

# Better Auth
BETTER_AUTH_SECRET="mientior_better_auth_secret_2024_very_secure"
BETTER_AUTH_URL="http://localhost:3000"

# Optional: Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Démarrer l'Application

```bash
npm run dev
```

## 📊 Architecture de la Base de Données

### Modèles Better Auth

#### `BetterAuthUser`
- Utilisé uniquement pour l'authentification
- Champs : `id`, `name`, `email`, `emailVerified`, `image`
- Relations : `accounts[]`, `sessions[]`

#### `Session`
- Gère les sessions utilisateur actives
- Tokens sécurisés avec expiration
- Tracking IP et User-Agent

#### `Account`
- Stocke les credentials (email/password)
- Support OAuth (Google, etc.)
- Gestion des tokens d'accès/rafraîchissement

#### `Verification`
- Tokens de vérification d'email (si activé)
- Tokens de réinitialisation de mot de passe

### Séparation des Données

**BetterAuthUser** (Authentification) vs **User** (E-commerce)

- `BetterAuthUser` : Gestion de l'authentification uniquement
- `User` : Données e-commerce (commandes, fidélité, adresses)

**Future** : Ces modèles seront liés via un champ `userId` partagé.

## 🧪 Tester l'Authentification

### 1. Créer un Compte

Visitez : http://localhost:3000/register

- Nom : Jean Dupont
- Email : jean@exemple.com
- Mot de passe : password123

### 2. Se Connecter

Visitez : http://localhost:3000/login

- Email : jean@exemple.com
- Mot de passe : password123

### 3. Vérifier la Session

Le Header devrait afficher :
- **Avant connexion** : Bouton "Connexion"
- **Après connexion** : Avatar avec menu dropdown

## ⚠️ Problèmes Courants

### Erreur : "Échec de l'inscription"

**Cause** : Les tables Better Auth n'existent pas dans la base de données

**Solution** :
```bash
npx prisma db push
npx prisma generate
npm run dev
```

### Erreur : "Authentication failed against database"

**Cause** : PostgreSQL n'est pas démarré ou credentials incorrects

**Solution** :
```bash
sudo systemctl start postgresql
# Vérifier les credentials dans .env.local
```

### Erreur : "searchParams should be awaited"

**Cause** : Next.js 15 requiert async/await pour searchParams

**Solution** : ✅ Déjà corrigé dans les pages login/register/reset-password

## 🔐 Fonctionnalités Disponibles

- ✅ Inscription email/password
- ✅ Connexion email/password
- ✅ Déconnexion
- ✅ Sessions persistantes (7 jours)
- ✅ Protection des routes `/account/*` et `/checkout/*`
- ⏳ Réinitialisation de mot de passe (UI prête, backend à implémenter)
- ⏳ Google OAuth (configuration requise)

## 🎯 Prochaines Étapes

1. **Appliquer les migrations** : `npx prisma db push`
2. **Tester l'inscription/connexion**
3. **Implémenter le backend de réinitialisation de mot de passe**
4. **Lier BetterAuthUser et User**
5. **Ajouter Google OAuth (optionnel)**

## 📝 Commandes Utiles

```bash
# Voir les tables créées
npx prisma studio

# Réinitialiser la base de données
npx prisma migrate reset

# Vérifier le schéma
npx prisma validate

# Générer le client Prisma
npx prisma generate
```
