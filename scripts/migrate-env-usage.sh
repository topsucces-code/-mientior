#!/bin/bash

# Script de migration automatique des process.env vers env
# Usage: ./scripts/migrate-env-usage.sh

set -e

echo "🔄 Migration des variables d'environnement vers env..."
echo ""

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_FILES=0
MIGRATED_FILES=0
SKIPPED_FILES=0

# Fichiers à exclure
EXCLUDE_PATTERNS=(
  "node_modules"
  ".next"
  "dist"
  "build"
  "coverage"
  "src/lib/env.ts"
  "src/lib/env.test.ts"
  "scripts/"
  "testsprite_venv"
)

# Fonction pour vérifier si un fichier doit être exclu
should_exclude() {
  local file=$1
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    if [[ $file == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

# Fonction pour migrer un fichier
migrate_file() {
  local file=$1
  
  # Vérifier si le fichier contient process.env
  if ! grep -q "process\.env\." "$file"; then
    return 1
  fi
  
  echo -e "${YELLOW}📝 Migration: $file${NC}"
  
  # Créer une backup
  cp "$file" "$file.backup"
  
  # Vérifier si le fichier importe déjà env
  if ! grep -q "from '@/lib/env'" "$file" && ! grep -q 'from "@/lib/env"' "$file"; then
    # Ajouter l'import en haut du fichier (après les autres imports)
    # Trouver la dernière ligne d'import
    last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
    
    if [ -n "$last_import_line" ]; then
      # Insérer après la dernière ligne d'import
      sed -i "${last_import_line}a\\import { env } from '@/lib/env'" "$file"
    else
      # Pas d'imports, ajouter au début
      sed -i "1i\\import { env } from '@/lib/env'\n" "$file"
    fi
  fi
  
  # Remplacer les process.env par env
  # Liste des variables connues à remplacer
  sed -i 's/process\.env\.PRISMA_DATABASE_URL/env.PRISMA_DATABASE_URL/g' "$file"
  sed -i 's/process\.env\.REDIS_URL/env.REDIS_URL/g' "$file"
  sed -i 's/process\.env\.BETTER_AUTH_SECRET/env.BETTER_AUTH_SECRET/g' "$file"
  sed -i 's/process\.env\.BETTER_AUTH_URL/env.BETTER_AUTH_URL/g' "$file"
  sed -i 's/process\.env\.PAYSTACK_SECRET_KEY/env.PAYSTACK_SECRET_KEY/g' "$file"
  sed -i 's/process\.env\.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY/env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY/g' "$file"
  sed -i 's/process\.env\.FLUTTERWAVE_SECRET_KEY/env.FLUTTERWAVE_SECRET_KEY/g' "$file"
  sed -i 's/process\.env\.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY/env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY/g' "$file"
  sed -i 's/process\.env\.RESEND_API_KEY/env.RESEND_API_KEY/g' "$file"
  sed -i 's/process\.env\.EMAIL_FROM/env.EMAIL_FROM/g' "$file"
  sed -i 's/process\.env\.NEXT_PUBLIC_APP_URL/env.NEXT_PUBLIC_APP_URL/g' "$file"
  sed -i 's/process\.env\.NEXT_PUBLIC_SERVER_URL/env.NEXT_PUBLIC_SERVER_URL/g' "$file"
  sed -i 's/process\.env\.NODE_ENV/env.NODE_ENV/g' "$file"
  sed -i 's/process\.env\.GOOGLE_CLIENT_ID/env.GOOGLE_CLIENT_ID/g' "$file"
  sed -i 's/process\.env\.GOOGLE_CLIENT_SECRET/env.GOOGLE_CLIENT_SECRET/g' "$file"
  sed -i 's/process\.env\.SENTRY_DSN/env.SENTRY_DSN/g' "$file"
  sed -i 's/process\.env\.REVALIDATION_SECRET/env.REVALIDATION_SECRET/g' "$file"
  sed -i 's/process\.env\.ALLOW_GUEST_CHECKOUT/env.ALLOW_GUEST_CHECKOUT/g' "$file"
  sed -i 's/process\.env\.ENABLE_STORE_PICKUP/env.ENABLE_STORE_PICKUP/g' "$file"
  sed -i 's/process\.env\.RUN_INTEGRATION_TESTS/env.RUN_INTEGRATION_TESTS/g' "$file"
  sed -i 's/process\.env\.APPLE_PAY_MERCHANT_ID/env.APPLE_PAY_MERCHANT_ID/g' "$file"
  sed -i 's/process\.env\.APPLE_PAY_CERT_PATH/env.APPLE_PAY_CERT_PATH/g' "$file"
  sed -i 's/process\.env\.APPLE_PAY_KEY_PATH/env.APPLE_PAY_KEY_PATH/g' "$file"
  sed -i 's/process\.env\.GOOGLE_PAY_GATEWAY/env.GOOGLE_PAY_GATEWAY/g' "$file"
  sed -i 's/process\.env\.GOOGLE_PAY_MERCHANT_ID/env.GOOGLE_PAY_MERCHANT_ID/g' "$file"
  sed -i 's/process\.env\.PAYPAL_CLIENT_ID/env.PAYPAL_CLIENT_ID/g' "$file"
  sed -i 's/process\.env\.PAYPAL_CLIENT_SECRET/env.PAYPAL_CLIENT_SECRET/g' "$file"
  sed -i 's/process\.env\.PAYPAL_API_URL/env.PAYPAL_API_URL/g' "$file"
  sed -i 's/process\.env\.NEXT_PUBLIC_URL/env.NEXT_PUBLIC_APP_URL/g' "$file"
  sed -i 's/process\.env\.NEXT_PUBLIC_DOMAIN/env.NEXT_PUBLIC_DOMAIN/g' "$file"
  sed -i 's/process\.env\.ADDRESS_VALIDATION_API_KEY/env.ADDRESS_VALIDATION_API_KEY/g' "$file"
  
  # Vérifier si des process.env restent
  if grep -q "process\.env\." "$file"; then
    echo -e "${YELLOW}  ⚠️  Certains process.env n'ont pas été migrés automatiquement${NC}"
    echo "  Variables restantes:"
    grep -o "process\.env\.[A-Z_]*" "$file" | sort -u | sed 's/^/    - /'
  fi
  
  return 0
}

# Trouver tous les fichiers TypeScript/JavaScript
echo "🔍 Recherche des fichiers à migrer..."
FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null)

for file in $FILES; do
  if should_exclude "$file"; then
    continue
  fi
  
  TOTAL_FILES=$((TOTAL_FILES + 1))
  
  if migrate_file "$file"; then
    MIGRATED_FILES=$((MIGRATED_FILES + 1))
  else
    SKIPPED_FILES=$((SKIPPED_FILES + 1))
  fi
done

echo ""
echo "✅ Migration terminée!"
echo ""
echo "📊 Statistiques:"
echo "  - Fichiers analysés: $TOTAL_FILES"
echo "  - Fichiers migrés: $MIGRATED_FILES"
echo "  - Fichiers ignorés: $SKIPPED_FILES"
echo ""
echo "💡 Prochaines étapes:"
echo "  1. Vérifier les fichiers migrés"
echo "  2. Exécuter les tests: npm test"
echo "  3. Si tout fonctionne, supprimer les backups: find src -name '*.backup' -delete"
echo "  4. Si problème, restaurer: find src -name '*.backup' -exec bash -c 'mv \"\$0\" \"\${0%.backup}\"' {} \;"
echo ""
