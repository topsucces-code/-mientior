# Guide des Interfaces PostgreSQL pour Mientior

## 🎯 Option 1 : Prisma Studio (Recommandé pour le développement)

**Installation :** ✅ Déjà installé dans le projet

**Lancement :**
```bash
npm run db:studio
```

**Accès :** http://localhost:5555

**Avantages :**
- Déjà configuré avec votre schéma Prisma
- Interface moderne et intuitive
- Pas de configuration supplémentaire nécessaire
- Synchronisé automatiquement avec votre code

---

## 🔧 Option 2 : pgAdmin 4

**Installation :**
```bash
sudo snap install pgadmin4
```

**Lancement :**
```bash
pgadmin4
```

**Configuration de la connexion :**
1. Ouvrir pgAdmin 4
2. Clic droit sur "Servers" → "Register" → "Server"
3. **General tab :**
   - Name: `Mientior Local`
4. **Connection tab :**
   - Host: `localhost`
   - Port: `5432`
   - Database: `mientior`
   - Username: `user` (selon votre .env)
   - Password: `password` (selon votre .env)
   - Save password: ✓

**Avantages :**
- Interface complète et professionnelle
- Gestion avancée de PostgreSQL
- Export/Import de données
- Éditeur SQL avec autocomplétion

---

## 🐝 Option 3 : Beekeeper Studio (Interface moderne)

**Installation :**
```bash
sudo snap install beekeeper-studio
```

**Lancement :**
```bash
beekeeper-studio
```

**Configuration de la connexion :**
1. Cliquer sur "New Connection"
2. Type: `PostgreSQL`
3. Host: `localhost`
4. Port: `5432`
5. User: `user`
6. Password: `password`
7. Default Database: `mientior`
8. Cliquer sur "Connect"

**Avantages :**
- Interface moderne et élégante
- Léger et rapide
- Support multi-plateformes
- Autocomplétion SQL intelligente

---

## 🦫 Option 4 : DBeaver (Multi-base de données)

**Installation :**
```bash
sudo snap install dbeaver-ce
```

**Configuration :**
1. Database → New Database Connection
2. Sélectionner PostgreSQL
3. Remplir les informations de connexion (comme ci-dessus)

**Avantages :**
- Support de multiples bases de données
- Diagrammes ER automatiques
- Éditeur SQL avancé
- Gratuit et open-source

---

## 💻 Option 5 : psql (CLI)

**Utilisation :**
```bash
# Connexion à la base
psql -h localhost -U user -d mientior

# Commandes utiles
\l                          # Liste toutes les bases
\dt                         # Liste toutes les tables
\dt public.*                # Tables dans le schéma 'public' (Payload)
\dt app.*                   # Tables dans le schéma 'app' (Prisma)
\d nom_table               # Décrit une table
\x                         # Toggle expanded display
SELECT * FROM users;       # Requête SQL
\q                         # Quitter
```

---

## 📊 Configuration de votre base Mientior

Votre projet utilise **deux schémas** dans la même base PostgreSQL :

### Schéma `public` (Payload CMS)
- Collections: Products, Categories, Orders, Users, Media, Tags
- Géré par Payload CMS
- Connexion: `DATABASE_URL`

### Schéma `app` (Prisma)
- Tables: Analytics, AuditLog, etc.
- Géré par Prisma
- Connexion: `PRISMA_DATABASE_URL`

---

## 🚀 Démarrage Rapide

Pour voir vos données immédiatement :

```bash
# Terminal 1 : Lancer Prisma Studio
npm run db:studio

# Ouvrir dans le navigateur
# http://localhost:5555
```

---

## ⚙️ Variables d'environnement

Assurez-vous que votre fichier `.env` contient :

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/mientior?schema=public
PRISMA_DATABASE_URL=postgresql://user:password@localhost:5432/mientior?schema=app
```

**Note :** Remplacez `user` et `password` par vos vraies informations de connexion PostgreSQL.

---

## 🆘 Dépannage

### pgAdmin ne démarre pas
```bash
# Vérifier l'installation
snap list | grep pgadmin

# Réinstaller si nécessaire
sudo snap remove pgadmin4
sudo snap install pgadmin4
```

### Erreur de connexion "peer authentication failed"
Modifiez `/etc/postgresql/*/main/pg_hba.conf` :
```
# Changez 'peer' en 'md5' pour local
local   all   all   md5
```

### Port 5432 déjà utilisé
```bash
# Vérifier les processus PostgreSQL
sudo lsof -i :5432

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

---

## 📝 Recommandation

**Pour le développement quotidien :** Utilisez **Prisma Studio** (`npm run db:studio`)

**Pour les opérations avancées :** Utilisez **Beekeeper Studio** ou **pgAdmin 4**

**Pour les scripts et automatisation :** Utilisez **psql**
