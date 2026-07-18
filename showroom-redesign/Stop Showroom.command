#!/bin/zsh
set -e

PORT=4310
PIDS=$(/usr/sbin/lsof -tiTCP:$PORT -sTCP:LISTEN || true)
if [[ -n "$PIDS" ]]; then
  /bin/kill $PIDS
fi
