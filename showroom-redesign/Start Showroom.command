#!/bin/zsh
set -e

SCRIPT_DIR=${0:A:h}
cd "$SCRIPT_DIR"
mkdir -p ".runtime"

PORT=4310
if /usr/sbin/lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  /usr/bin/open "http://127.0.0.1:$PORT/"
  exit 0
fi

/usr/bin/nohup /usr/bin/python3 -u app.py >> ".runtime/showroom.log" 2>&1 </dev/null &
sleep 1
/usr/bin/open "http://127.0.0.1:$PORT/"
