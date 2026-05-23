#!/usr/bin/env bash
set -euo pipefail

rm -rf public
mkdir -p public

find . -maxdepth 1 -type f \( \
  -name '*.html' -o \
  -name '*.css' -o \
  -name '*.js' -o \
  -name '*.xml' -o \
  -name '*.txt' -o \
  -name '*.ico' -o \
  -name '*.png' -o \
  -name '_redirects' \
\) -exec cp {} public/ \;

cp -R images public/images
cp -R assets public/assets
