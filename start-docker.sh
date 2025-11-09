#!/bin/bash

echo "🐳 Démarrage de Docker Compose..."
echo ""

# Démarrer Docker daemon si nécessaire
sudo systemctl start docker

# Télécharger les images
echo "📥 Téléchargement des images Docker..."
sudo docker pull postgres:16-alpine
sudo docker pull redis:7-alpine

# Démarrer les conteneurs
echo ""
echo "🚀 Démarrage des conteneurs..."
sudo docker-compose up -d

# Attendre que les services soient prêts
echo ""
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérifier le statut
echo ""
echo "✅ Statut des conteneurs:"
sudo docker-compose ps

echo ""
echo "🎉 Docker Compose démarré avec succès!"
echo ""
echo "Services disponibles:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"

