#!/bin/bash
set -euo pipefail

# Ir para o diretório do script para caminhos consistentes
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ativar venv se disponível
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Aviso: venv não encontrado em $SCRIPT_DIR/.venv; usando Python do sistema."
fi

# Carregar variáveis de ambiente de .env se existir
if [ -f ".env" ]; then
    set -a
    source ".env"
    set +a
else
    echo "Aviso: arquivo .env não encontrado; exporte ALERT_TO, GMAIL_USER e GMAIL_APP_PASSWORD no ambiente."
fi

# Valores padrão de paths se não definidos
export MONITOR_DB="${MONITOR_DB:-$PWD/monitor.sqlite3}"
export MONITOR_LOG="${MONITOR_LOG:-$PWD/monitor.log}"

# Intervalo de espera entre execuções (pode ser sobrescrito via env)
SLEEP_SECONDS="${SLEEP_SECONDS:-20}"

while true; do
    echo -e "\n   ===== INICIANDO $(date) ====="
    python3 news_monitor/monitor_universal.py
    echo "===== FINALIZADO $(date) ====="

    echo ""
    for i in $(seq "$SLEEP_SECONDS" -1 1); do
        echo -ne "\rTempo restante para a próxima iteração: $i segundos   "
        sleep 1
    done
    sleep 3
done
