#!/bin/bash

shopt -s globstar

# **/*.{svg,html}

cd "${1:-dist}"
pwd
tar --create \
  --file dist.tar \
  --verbose \
  index.html \
  **/*.svg
