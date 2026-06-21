#!/bin/bash
# Перезапуск dev-сервера для карты D4
# Убить процесс на порту 3100
PID=$(netstat -ano | grep ":3100" | head -1 | awk '{print $5}' | tr -d ' ')
if [ -n "$PID" ] && [ "$PID" != "0" ]; then
  echo "Killing PID $PID on port 3100..."
  taskkill //F //PID $PID 2>/dev/null
  sleep 2
fi

echo "Starting dev server..."
cd "$(dirname "$0")"
bun run dev --filter=games-web
