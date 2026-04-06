#!/bin/bash
# ============================================================
# CASER WEB 2026 - Script de configuración Git + GitHub
# Ejecuta este script desde tu Terminal en Mac
# ============================================================

set -e

echo ""
echo "🚀 Configurando repositorio Git para Caser WEB 2026..."
echo ""

# 1. Obtener la ruta actual (donde está este script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Carpeta del proyecto: $SCRIPT_DIR"

# 2. Crear copia en el Escritorio (Desktop)
DESKTOP="$HOME/Desktop"
DEST="$DESKTOP/caser-web-2026"

echo ""
echo "📋 Copiando archivos al Escritorio..."
cp -r "$SCRIPT_DIR" "$DEST" 2>/dev/null || { echo "⚠️  La carpeta ya existe en el Escritorio. Usando la existente."; DEST="$SCRIPT_DIR"; }

cd "$DEST"

# 3. Inicializar Git
echo ""
echo "🔧 Inicializando repositorio Git..."
git init
git branch -m main

# 4. Configurar identidad (ajusta con tus datos si es necesario)
git config user.email "cmarchal@marchalconsultores.com"
git config user.name "Carlos Marchal"

# 5. Añadir todos los archivos y hacer commit inicial
echo ""
echo "📦 Haciendo commit inicial..."
git add .
git commit -m "Lanzamiento inicial - Web Caser Seguros de Salud

Web completa para Caser Seguros enfocada en seguros de salud:
- index.html: página principal con hero, productos, precios y FAQ
- particulares, familiar, embarazo, mayores, autónomos
- calcular.html: formulario de presupuesto
- css/styles.css: estilos con colores corporativos Caser
- js/main.js: menú móvil, FAQ acordeón, formulario dinámico"

echo ""
echo "✅ Repositorio Git creado correctamente en: $DEST"
echo ""
echo "============================================================"
echo "  PRÓXIMO PASO: Crear el repositorio en GitHub y hacer push"
echo "============================================================"
echo ""
echo "1. Ve a https://github.com/new"
echo "2. Nombre del repositorio: caser-web-2026"
echo "3. Ponlo en Privado o Público según prefieras"
echo "4. NO marques 'Initialize this repository with a README'"
echo "5. Haz clic en 'Create repository'"
echo "6. Luego ejecuta estos comandos (sustituye TU_USUARIO por tu usuario de GitHub):"
echo ""
echo "   cd \"$DEST\""
echo "   git remote add origin https://github.com/TU_USUARIO/caser-web-2026.git"
echo "   git push -u origin main"
echo ""
echo "============================================================"
echo "  Para ver la web en local abre en tu navegador:"
echo "  $DEST/index.html"
echo "============================================================"
echo ""
