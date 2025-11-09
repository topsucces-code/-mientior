# 🐳 Configuration Docker pour Mientior

## Installation de Docker

Si Docker n'est pas encore installé :

```bash
# Installer Docker et Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose

# Ajouter votre utilisateur au groupe docker (pour éviter sudo)
sudo usermod -aG docker $USER

# Redémarrer la session ou exécuter :
newgrp docker

# Démarrer le service Docker
sudo systemctl start docker
sudo systemctl enable docker
```

## Démarrage des services

```bash
# Démarrer PostgreSQL + Redis
docker-compose up -d

# Vérifier que les services sont démarrés
docker-compose ps

# Voir les logs
docker-compose logs -f
```

## Initialisation de la base de données

```bash
# Créer le schéma 'app' pour Prisma
docker exec -it mientior-postgres psql -U mientior -d mientior_db -c "CREATE SCHEMA IF NOT EXISTS app;"

# Générer le client Prisma
npx prisma generate

# Pousser le schéma Prisma vers la DB
npx prisma db push

# (Optionnel) Ouvrir Prisma Studio pour voir la DB
npx prisma studio
```

## Commandes utiles

```bash
# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v

# Redémarrer les services
docker-compose restart

# Voir les logs d'un service spécifique
docker-compose logs -f postgres
docker-compose logs -f redis

# Accéder au shell PostgreSQL
docker exec -it mientior-postgres psql -U mientior -d mientior_db

# Accéder au shell Redis
docker exec -it mientior-redis redis-cli
```

## Connexion à la base de données

Les services sont accessibles sur :

- **PostgreSQL** : `localhost:5432`
  - User: `mientior`
  - Password: `mientior_password_2024`
  - Database: `mientior_db`

- **Redis** : `localhost:6379`

## Vérification

```bash
# Tester la connexion PostgreSQL
docker exec -it mientior-postgres psql -U mientior -d mientior_db -c "SELECT version();"

# Tester la connexion Redis
docker exec -it mientior-redis redis-cli ping
```

## Démarrage de l'application

Une fois les services Docker démarrés :

```bash
# Démarrer Next.js
npm run dev
```

L'application sera accessible sur http://localhost:3000

## Troubleshooting

### Port déjà utilisé

Si le port 5432 ou 6379 est déjà utilisé :

```bash
# Modifier les ports dans docker-compose.yml
# Par exemple : "5433:5432" au lieu de "5432:5432"
```

### Réinitialiser complètement

```bash
# Arrêter et supprimer tout
docker-compose down -v

# Redémarrer
docker-compose up -d

# Recréer les schémas
docker exec -it mientior-postgres psql -U mientior -d mientior_db -c "CREATE SCHEMA IF NOT EXISTS app;"
npx prisma db push
```

