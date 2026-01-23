#!/bin/bash
cd /workspaces/bbruno123.github.io/news_alert_script
source .venv/bin/activate
export ALERT_TO="ryanfabres@gmail.com"
export GMAIL_USER="bruno.spams.email@gmail.com"
export GMAIL_APP_PASSWORD="ttdz yzix pklw ngsd"
export MONITOR_DB="$PWD/monitor.sqlite3"
export MONITOR_LOG="$PWD/monitor.log"

while true; do
    echo -e "\n   ===== INICIANDO $(date) ====="
    python3 news_monitor/monitor_universal.py
    echo "===== FINALIZADO $(date) ====="

    SLEEP_SECONDS=3600  # ajuste aqui

    echo ""  # quebra de linha
    # echo "Aguardando $SLEEP_SECONDS segundos antes da próxima iteração..."
    for i in $(seq "$SLEEP_SECONDS" -1 1); do
        echo -ne "\rTempo restante para a próxima iteração: $i segundos   "
        sleep 1
    done
    # echo -ne "\rPróxima iteração em 3 segundos...   \n"
    sleep 3
done
