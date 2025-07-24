#!/bin/bash

cd "${1:-dist}"
pwd
tar --create \
  --file dist.tar \
  --verbose \
  *.{svg,html}
