# 🎯 Guide d'utilisation VS Code pour Mientior

Ce guide vous aide à utiliser VS Code efficacement avec les documents de roadmap et cahier de charge.

---

## 📂 Fichiers de référence

Vous avez 3 documents principaux à la racine du projet :

1. **ANALYSE_EXECUTIVE_SUMMARY.md** (8 pages)
   - Résumé rapide du projet
   - Points critiques
   - Prochaines étapes
   - 👉 **À lire en premier !**

2. **CAHIER_DE_CHARGE.md** (37 pages)
   - Spécifications techniques détaillées
   - Architecture complète
   - Exigences fonctionnelles
   - 👉 **Référence technique**

3. **ROADMAP.md** (45 pages)
   - 4 phases de développement
   - 15 sprints détaillés
   - Tâches avec critères d'acceptation
   - 👉 **Guide de développement**

---

## 🎨 Configuration multi-panneaux recommandée

### Layout optimal

```
┌──────────────────────────────────────────────────────┐
│ Barre supérieure : Tabs des fichiers ouverts        │
├─────────────────────────┬────────────────────────────┤
│                         │                            │
│  ROADMAP.md             │  Fichier code actuel       │
│  (aperçu Markdown)      │  (exemple: login/page.tsx) │
│                         │                            │
│  📖 Lecture facile      │  ✏️ Édition code           │
│                         │                            │
├─────────────────────────┼────────────────────────────┤
│                         │                            │
│  Explorateur fichiers   │  Terminal                  │
│  (Sidebar gauche)       │  (npm run dev)             │
│                         │                            │
└─────────────────────────┴────────────────────────────┘
```

### Comment créer cette disposition :

1. **Ouvrir ROADMAP.md**
   - Clic droit sur le fichier → "Open Preview to the Side"
   - Ou : `Ctrl+K V` (Windows/Linux) / `Cmd+K V` (Mac)

2. **Positionner les panneaux**
   - Glisser-déposer les onglets pour les organiser
   - Utiliser `Ctrl+\` pour splitter un éditeur

3. **Terminal en bas**
   - `Ctrl+ù` ou View → Terminal
   - Lancer `npm run dev`

---

## ⚡ Raccourcis utiles

### Navigation dans les documents

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Shift+O` | Outline du fichier (voir tous les titres) |
| `Ctrl+P` | Quick open (chercher un fichier) |
| `Ctrl+Shift+F` | Recherche globale dans tous les fichiers |
| `Ctrl+G` | Aller à la ligne |
| `Ctrl+Click` | Suivre un lien dans Markdown |

### Aperçu Markdown

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Shift+V` | Ouvrir aperçu Markdown |
| `Ctrl+K V` | Ouvrir aperçu côte à côte |
| `Ctrl+K Z` | Mode Zen (plein écran) |

### Développement

| Raccourci | Action |
|-----------|--------|
| `Ctrl+Shift+B` | Build (npm run build) |
| `Ctrl+Shift+P` → "Tasks" | Lancer une tâche définie |
| `F5` | Lancer le debugger |

---

## 🎯 Utilisation des Tasks (tâches automatisées)

Appuyez sur `Ctrl+Shift+P` → tapez "Tasks: Run Task"

### Tasks disponibles :

- **📖 Ouvrir Guide Roadmap** - Ouvre ROADMAP.md
- **📋 Ouvrir Cahier de Charge** - Ouvre CAHIER_DE_CHARGE.md
- **📊 Ouvrir Synthèse Exécutive** - Ouvre ANALYSE_EXECUTIVE_SUMMARY.md
- **🚀 Start Dev Server** - Lance `npm run dev`
- **🏗️ Build Project** - Lance `npm run build`
- **🧹 Lint Code** - Lance `npm run lint`
- **💅 Format Code** - Lance `npm run format`
- **🗄️ Prisma Studio** - Ouvre l'interface DB
- **🔄 Push DB Schema** - Met à jour la DB avec Prisma
- **📧 Test Email** - Envoie un email de test

---

## 📚 Workflow recommandé

### 🔴 PHASE 1 : Démarrer un sprint

1. **Ouvrir ROADMAP.md** en aperçu (côté gauche)
2. **Naviguer vers le sprint** actuel (ex: Sprint 1.1)
3. **Lire les tâches** détaillées
4. **Créer les fichiers** nécessaires selon le sprint
5. **Coder** en gardant le roadmap visible

### Exemple : Sprint 1.1 - Authentification

```bash
# 1. Ouvrir le roadmap
Ctrl+P → "ROADMAP.md" → Ctrl+K V

# 2. Chercher "Sprint 1.1"
Ctrl+F → "Sprint 1.1"

# 3. Lire les tâches :
#    - Créer page Login
#    - Créer page Signup
#    - etc.

# 4. Créer le premier fichier
# Clic droit dans explorateur → New File
# src/app/(app)/login/page.tsx

# 5. Garder ROADMAP.md ouvert à gauche pour référence
```

---

## 🔍 Recherche dans les documents

### Chercher une fonctionnalité spécifique

**Exemple : "Comment implémenter les avis produits ?"**

1. `Ctrl+Shift+F` (recherche globale)
2. Tapez "avis produits" ou "reviews"
3. Filtrer par `*.md` (seulement les docs)
4. Voir tous les résultats dans ROADMAP.md et CAHIER_DE_CHARGE.md

### Chercher par priorité

- Recherche `🔴` → Tâches critiques
- Recherche `🟡` → Tâches importantes
- Recherche `🟢` → Tâches moyennes
- Recherche `⚪` → Nice to have

---

## 💡 Tips & Astuces

### 1. Outline pour navigation rapide

- Ouvrir ROADMAP.md
- Cliquer sur l'icône "Outline" dans la sidebar (ou `Ctrl+Shift+O`)
- Voir tous les titres (Phase 1, Sprint 1.1, etc.)
- Cliquer pour naviguer instantanément

### 2. Breadcrumbs activées

En haut de l'éditeur, vous voyez le chemin du fichier.
Cliquez dessus pour naviguer rapidement.

### 3. Minimap

À droite de l'éditeur, une minimap du fichier.
Utile pour les longs documents comme ROADMAP.md (45 pages).

### 4. Favoris (Bookmarks)

Extension recommandée : **Bookmarks** (alefragnani.Bookmarks)

Marquez les sections importantes :
- `Ctrl+Alt+K` : Toggle bookmark
- `Ctrl+Alt+J` : Jump to next bookmark

### 5. Todo Tree

Extension recommandée : **Todo Tree** (Gruntfuggly.todo-tree)

Voit tous les `[ ]` et `[x]` dans ROADMAP.md comme une todo list.

---

## 🎨 Extensions VS Code recommandées

### Markdown

- **Markdown All in One** (yzhang.markdown-all-in-one)
  - Keyboard shortcuts, table of contents, auto preview

- **Markdown Preview GitHub Styling** (bierner.markdown-preview-github-styles)
  - Aperçu style GitHub (plus joli)

### Développement

- **Prisma** (Prisma.prisma)
  - Syntax highlighting pour schema.prisma

- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
  - Autocomplete classes Tailwind

- **ESLint** (dbaeumer.vscode-eslint)
  - Lint en temps réel

- **Prettier** (esbenp.prettier-vscode)
  - Formatage automatique

- **Auto Import** (steoates.autoimport)
  - Auto-import des modules

### Productivité

- **Project Manager** (alefragnani.project-manager)
  - Switch entre projets facilement

- **GitLens** (eamodio.gitlens)
  - Git supercharged

- **Thunder Client** (rangav.vscode-thunder-client)
  - Tester vos API endpoints (alternative à Postman)

---

## 📖 Comment utiliser ce guide au quotidien

### Matin (planification)

1. Ouvrir **ROADMAP.md**
2. Voir le sprint actuel
3. Lire les tâches du jour
4. Cocher `[ ]` → `[x]` au fur et à mesure

### Pendant le code (référence)

1. Garder **ROADMAP.md** ou **CAHIER_DE_CHARGE.md** ouvert en split
2. Référencer les spécifications techniques
3. Copier-coller les exemples de code

### Soir (review)

1. Vérifier les tâches complétées
2. Mettre à jour les checkboxes
3. Planifier le lendemain

---

## 🚀 Exemple de session de développement

### Objectif : Créer la page de login (Sprint 1.1, Tâche 1)

```bash
# 1. Ouvrir le workspace
File → Open Workspace from File → mientior.code-workspace

# 2. Ouvrir ROADMAP.md en split
Ctrl+P → "ROADMAP.md" → Ctrl+K V

# 3. Chercher la section
Ctrl+F → "Créer page Login"

# 4. Lire les specs :
Sprint 1.1 dit :
- Formulaire email/password avec validation Zod
- Intégration Better Auth (auth.api.signInEmail)
- Gestion erreurs
- Lien "Mot de passe oublié"
- Bouton Google OAuth (si configuré)
- Redirection vers ?next= param ou /account

# 5. Créer le fichier
src/app/(app)/login/page.tsx

# 6. Coder en référençant le roadmap
# Voir exemples dans CAHIER_DE_CHARGE.md section 5.5

# 7. Tester
npm run dev
http://localhost:3000/login

# 8. Cocher la tâche
Dans ROADMAP.md :
- [ ] Créer page Login
→
- [x] Créer page Login
```

---

## 🎯 Navigation rapide vers les sections clés

### Dans ROADMAP.md

| Section | Ligne (approx) | Raccourci |
|---------|----------------|-----------|
| Phase 1 (MVP) | Ligne 50 | `Ctrl+G` → 50 |
| Sprint 1.1 (Auth) | Ligne 80 | `Ctrl+G` → 80 |
| Sprint 1.2 (Checkout) | Ligne 200 | `Ctrl+G` → 200 |
| Phase 2 (UX) | Ligne 500 | `Ctrl+G` → 500 |
| Planning global | Ligne 1200 | `Ctrl+G` → 1200 |

### Dans CAHIER_DE_CHARGE.md

| Section | Recherche | Description |
|---------|-----------|-------------|
| Architecture | `Ctrl+F` → "Architecture" | Stack technique |
| API Routes | `Ctrl+F` → "API Routes" | Liste endpoints |
| Database Schema | `Ctrl+F` → "Database Schema" | Modèles Prisma |
| Tunnel d'achat | `Ctrl+F` → "Tunnel d'achat" | Specs checkout |

---

## 🔧 Troubleshooting

### Aperçu Markdown ne s'affiche pas

- Installer extension "Markdown All in One"
- Redémarrer VS Code

### Tasks ne fonctionnent pas

- Vérifier que `tasks.json` existe dans `.vscode/`
- `Ctrl+Shift+P` → "Tasks: Configure Task"

### IntelliSense Prisma ne marche pas

- Installer extension "Prisma"
- Lancer `npx prisma generate`

---

## 📞 Support

Si vous avez des questions sur :
- **Le code** : Voir CLAUDE.md (instructions projet)
- **Les specs** : Voir CAHIER_DE_CHARGE.md
- **Le roadmap** : Voir ROADMAP.md
- **VS Code** : Ce fichier (GUIDE_VSCODE.md)

---

**Happy coding! 🚀**

*Document créé le 17 novembre 2025*
