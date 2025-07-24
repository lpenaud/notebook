#!/bin/bash

shopt -s globstar

cd "${1:-dist}"
pwd
tar --create \
  --gzip \
  --file dist.tar \
  --verbose \
  **/*.{svg,html}
