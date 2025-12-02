# Plan de Reprise d'Activité (Disaster Recovery Plan) - Mientior

**Version**: 1.0  
**Date**: 19 Novembre 2025  
**Statut**: Actif

---

## 1. Vue d'Ensemble

Ce document définit les procédures à suivre en cas d'incident majeur affectant la disponibilité ou l'intégrité des données de la plateforme Mientior.

### Objectifs (RTO/RPO)

- **RTO (Recovery Time Objective)** : 4 heures
  - Temps maximum pour rétablir le service après un incident.
- **RPO (Recovery Point Objective)** : 1 heure
  - Perte de données maximale admissible (correspond à la fréquence des backups).

---

## 2. Stratégie de Sauvegarde

### Base de Données (PostgreSQL)
- **Fréquence** : Quotidienne (Full) + Transaction Logs (WAL) en continu (si géré par provider cloud)
- **Rétention** : 30 jours
- **Stockage** : S3 (ou équivalent) dans une région différente de la production
- **Script** : `scripts/backup-db.sh`

### Cache (Redis)
- **Fréquence** : Snapshots quotidiens (RDB)
- **Persistance** : AOF (Append Only File) activé pour durabilité
- **Rétention** : 7 jours

### Fichiers (Media)
- **Stockage** : Cloudinary / S3
- **Redondance** : Assurée par le fournisseur (Cloudinary)
- **Backup** : Pas de backup manuel nécessaire si utilisation de service tiers avec SLA approprié.

---

## 3. Procédures de Restauration

### Scénario A : Corruption de Base de Données

1. **Arrêt de l'application**
   ```bash
   # Mettre l'application en mode maintenance
   # Arrêter les services consommateurs
   ```

2. **Identifier le backup sain**
   - Vérifier les logs pour déterminer l'heure de l'incident.
   - Choisir le dernier backup avant l'incident.

3. **Restaurer la base de données**
   ```bash
   # Créer une nouvelle DB ou vider l'existante
   gunzip -c backups/postgres/mientior_YYYYMMDD_HHMMSS.sql.gz | psql "$DATABASE_URL"
   ```

4. **Vérification**
   - Vérifier l'intégrité des données critiques (Users, Orders).
   - Lancer les tests de santé (`npm run test:health` - à créer).

5. **Redémarrage**
   - Relancer l'application.
   - Vérifier les logs.

### Scénario B : Panne Complète du Serveur

1. **Provisionner nouvelle infrastructure**
   - Utiliser Terraform/Ansible ou redéployer via Vercel/Railway.
   - Configurer les variables d'environnement.

2. **Restaurer les données**
   - Appliquer la procédure du Scénario A.

3. **Basculer le DNS**
   - Mettre à jour les enregistrements DNS si l'IP a changé.

---

## 4. Contacts d'Urgence

| Rôle | Nom | Contact |
|------|-----|---------|
| Lead Dev | Yao Elisée | [Email/Phone] |
| DevOps | [Nom] | [Email/Phone] |
| Hébergeur | Vercel/AWS | Support Portal |

---

## 5. Communication de Crise

1. **Interne** : Notifier l'équipe via Slack/Discord.
2. **Clients** : Page de maintenance avec estimation de retour.
3. **Post-Mortem** : Rédiger un rapport d'incident après résolution.

---

## 6. Tests du Plan

Ce plan doit être testé **tous les 3 mois**.

**Dernier test** : [Date]
**Résultat** : [Succès/Échec]
**Validé par** : [Nom]
