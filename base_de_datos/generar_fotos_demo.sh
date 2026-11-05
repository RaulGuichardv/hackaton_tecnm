#!/usr/bin/env bash
# Genera fotografías de demostración para los trabajadores del seed.
# Requiere ImageMagick (magick o convert). Las imágenes quedan en
# backend/uploads/fotos, carpeta ignorada por git.
set -euo pipefail

DESTINO="$(cd "$(dirname "$0")/../backend/uploads/fotos" && pwd)"
mkdir -p "$DESTINO"

if command -v magick >/dev/null 2>&1; then
  IMAGEN="magick"
elif command -v convert >/dev/null 2>&1; then
  IMAGEN="convert"
else
  echo "No se encontró ImageMagick. Instala imagemagick o agrega las fotos manualmente." >&2
  exit 1
fi

generar() {
  local archivo="$1" iniciales="$2" fondo="$3" texto="$4"
  "$IMAGEN" -size 400x500 "xc:$fondo" -fill "$texto" -gravity center \
    -pointsize 150 -annotate 0 "$iniciales" "$DESTINO/$archivo"
}

generar roberto.jpg      "RC" "#e0f2fe" "#075985"
generar monse.jpg        "M"  "#fce7f3" "#9d174d"
generar seed_ana.jpg      "AM" "#dbeafe" "#1e3a8a"
generar seed_carlos.jpg   "CR" "#dcfce7" "#14532d"
generar seed_maria.jpg    "MG" "#fce7f3" "#831843"
generar seed_jose.jpg     "JH" "#fef3c7" "#78350f"
generar seed_laura.jpg    "LJ" "#ede9fe" "#4c1d95"
generar seed_miguel.jpg   "MF" "#e2e8f0" "#334155"
generar seed_patricia.jpg "PV" "#cffafe" "#164e63"
generar seed_jorge.jpg    "JM" "#ffedd5" "#7c2d12"

echo "Fotografías de demostración generadas en $DESTINO"
