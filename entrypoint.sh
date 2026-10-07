#!/bin/sh
set -eu
DATA_DIR="${DATA_DIR:-/app/data}"
export DATA_DIR
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  chown -R node:node "$DATA_DIR"
  chmod 700 "$DATA_DIR"
  exec su -s /bin/sh node -c 'exec node /app/server.mjs'
fi
exec node /app/server.mjs
