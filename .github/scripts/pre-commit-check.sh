#!/bin/bash
set -e

echo "🔍 Ejecutando verificaciones pre-commit..."

echo "🧪 Ejecutando tests..."
npm test

echo "🏗️ Build TypeScript..."
npm run build

echo "✅ Verificaciones completadas"
