# News Alert Script

Este diretório contém o script de monitoramento de notícias que dispara alertas por email.

## Configuração local (.env)
- Copie [news_alert_script/.env.example](news_alert_script/.env.example) para [news_alert_script/.env](news_alert_script/.env).
- Preencha `ALERT_TO`, `GMAIL_USER` e `GMAIL_APP_PASSWORD` (senha de app do Gmail).
- O arquivo `.env` está ignorado via [ .gitignore ] e não deve ser commitado.

## Dependências
- Python 3.11+ recomendado.
- Crie/ative a venv e instale requisitos:

```bash
cd news_alert_script
python3 -m venv .venv
source .venv/bin/activate
pip install -r news_monitor/requirements.txt
```

## Execução contínua (local)
- `nohup`:

```bash
cd /workspaces/bbruno123.github.io/news_alert_script
nohup ./run_monitor.sh > monitor.out 2>&1 &
echo $! > monitor.pid
tail -f monitor.out
```

- `tmux` (instalar se necessário: `sudo apt update && sudo apt install -y tmux`):

```bash
tmux new -s news-monitor
cd /workspaces/bbruno123.github.io/news_alert_script
./run_monitor.sh
# Detachar: Ctrl+B, depois D
tmux attach -t news-monitor
```

## Execução contínua (GitHub Actions)
- Workflow agendado em [ .github/workflows/news-monitor.yml ].
- Adicione os secrets no repositório: `ALERT_TO`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.
- Rode manualmente com GitHub CLI:

```bash
gh auth login
gh repo set-default bbruno123/gtbtech.github.io
gh workflow run "News Monitor"
```

## Logs e estado
- Local: [news_alert_script/monitor.log](news_alert_script/monitor.log) e [news_alert_script/monitor.sqlite3](news_alert_script/monitor.sqlite3).
- GitHub Actions:
	- O banco/estado (`monitor.sqlite3`) é commitado para persistir entre execuções.
	- O log (`monitor.log`) é salvo como Artifact privado. Para baixar:

```bash
gh auth login
gh repo set-default bbruno123/gtbtech.github.io
# Liste execuções
gh run list --limit 5
# Baixe artifact da última execução
gh run download --name news-monitor-logs --dir ./artifacts
ls -l ./artifacts
```

	- Pelo site do GitHub: Actions → execução → Artifacts → `news-monitor-logs`.

