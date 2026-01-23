import os
import re
import time
import json
import sqlite3
import smtplib
import logging
from email.message import EmailMessage
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import requests
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as dtparser

# =========================
# CONFIG
# =========================
KEYWORD = "universal"
TZ_NAME = "America/Sao_Paulo"
TZ = ZoneInfo(TZ_NAME)

DB_PATH = os.getenv("MONITOR_DB", "monitor.sqlite3")
LOG_PATH = os.getenv("MONITOR_LOG", "monitor.log")

ALERT_TO = os.getenv("ALERT_TO", "ryanfabres@gmail.com")
GMAIL_USER = os.getenv("GMAIL_USER")            # ex.: seuemail@gmail.com
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")  # app password (16 chars)

REQUEST_TIMEOUT = 25
USER_AGENT = "NewsMonitor/1.0 (+https://example.local)"
HEADERS = {"User-Agent": USER_AGENT}

# Fontes
MD_RSS = "https://www.melhoresdestinos.com.br/feed/rss"

PDP_HOME = "https://passageirodeprimeira.com/"
PDP_RSS_CANDIDATES = [
    "https://passageirodeprimeira.com/feed/",
    "https://passageirodeprimeira.com/feed/rss",
]

MD_HOME = "https://www.melhoresdestinos.com.br/"

# Quantos links recentes pegar do HTML (quando não há RSS confiável)
MAX_HTML_LINKS = 25


# =========================
# LOGGING
# =========================
class TZFormatter(logging.Formatter):
    """Formatter que converte logs para o timezone configurado."""
    def formatTime(self, record, datefmt=None):
        dt = datetime.fromtimestamp(record.created, tz=TZ)
        if datefmt:
            return dt.strftime(datefmt)
        return dt.strftime("%Y-%m-%d %H:%M:%S %Z")

def setup_logging():
    formatter = TZFormatter("%(asctime)s %(levelname)s %(message)s")
    
    file_handler = logging.FileHandler(LOG_PATH, encoding="utf-8")
    file_handler.setFormatter(formatter)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)


# =========================
# DB (anti-duplicidade 48h)
# =========================
def db_connect():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            url TEXT PRIMARY KEY,
            guid TEXT,
            source TEXT,
            title TEXT,
            published_at TEXT,
            notified_at TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_notified_at ON notifications(notified_at)")
    conn.commit()
    return conn


def purge_old(conn, now_tz):
    cutoff = now_tz - timedelta(hours=48)
    conn.execute("DELETE FROM notifications WHERE notified_at < ?", (cutoff.isoformat(),))
    conn.commit()


def already_notified(conn, url, guid=None):
    cur = conn.cursor()
    if guid:
        cur.execute("SELECT 1 FROM notifications WHERE guid = ? LIMIT 1", (guid,))
        if cur.fetchone():
            return True
    cur.execute("SELECT 1 FROM notifications WHERE url = ? LIMIT 1", (url,))
    return cur.fetchone() is not None


def mark_notified(conn, url, guid, source, title, published_at, notified_at):
    conn.execute(
        "INSERT OR REPLACE INTO notifications(url, guid, source, title, published_at, notified_at) VALUES(?,?,?,?,?,?)",
        (url, guid, source, title, published_at, notified_at),
    )
    conn.commit()


# =========================
# DATE + MATCH HELPERS
# =========================
def parse_datetime_aware(s):
    """Return tz-aware datetime or None if not reliable."""
    if not s or not isinstance(s, str):
        return None
    try:
        dt = dtparser.parse(s)
    except Exception:
        return None
    if dt.tzinfo is None:
        return None
    return dt


def is_published_today(dt_aware, now_tz):
    if dt_aware is None:
        return False
    local_dt = dt_aware.astimezone(TZ)
    return local_dt.date() == now_tz.date()


def find_keyword_snippet(text, keyword=KEYWORD, radius=140):
    if not text:
        return None
    m = re.search(re.escape(keyword), text, flags=re.IGNORECASE)
    if not m:
        return None
    start = max(0, m.start() - radius)
    end = min(len(text), m.end() + radius)
    snippet = text[start:end].replace("\r", " ").replace("\n", " ")
    snippet = re.sub(r"\s+", " ", snippet).strip()
    return snippet


# =========================
# EMAIL (SMTP Gmail)
# =========================
def send_email_alert(to_addr, subject, body):
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise RuntimeError("Defina GMAIL_USER e GMAIL_APP_PASSWORD nas variáveis de ambiente.")

    msg = EmailMessage()
    msg["From"] = GMAIL_USER
    msg["To"] = to_addr
    msg["Subject"] = subject
    msg.set_content(body)

    # Gmail SMTP: STARTTLS na porta 587
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.ehlo()
        smtp.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        smtp.send_message(msg)


# =========================
# HTTP + PARSING
# =========================
def http_get(url):
    r = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    r.raise_for_status()
    return r.text


def extract_published_datetime_from_html(html):
    soup = BeautifulSoup(html, "html.parser")

    # (2) Open Graph published time (preferido)
    og = soup.find("meta", attrs={"property": "article:published_time"})
    if og and og.get("content"):
        dt = parse_datetime_aware(og["content"])
        if dt:
            return dt

    # JSON-LD (Article/NewsArticle) datePublished
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.get_text(strip=True)
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:
            continue

        candidates = []
        if isinstance(data, dict):
            candidates = [data]
        elif isinstance(data, list):
            candidates = [x for x in data if isinstance(x, dict)]

        for obj in candidates:
            date_published = obj.get("datePublished")
            if date_published:
                dt = parse_datetime_aware(str(date_published))
                if dt:
                    return dt

    # (3) <time datetime="...">
    t = soup.find("time", attrs={"datetime": True})
    if t and t.get("datetime"):
        dt = parse_datetime_aware(t["datetime"])
        if dt:
            return dt

    return None


def extract_title_from_html(html):
    soup = BeautifulSoup(html, "html.parser")
    ogt = soup.find("meta", attrs={"property": "og:title"})
    if ogt and ogt.get("content"):
        return ogt["content"].strip()
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return h1.get_text(strip=True)
    if soup.title and soup.title.get_text(strip=True):
        return soup.title.get_text(strip=True)
    return "(sem título)"


def extract_body_text_from_html(html):
    soup = BeautifulSoup(html, "html.parser")
    article = soup.find("article")
    if article:
        parts = [p.get_text(" ", strip=True) for p in article.find_all("p")]
        text = "\n".join([p for p in parts if p])
        if len(text) >= 200:
            return text

    parts = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    text = "\n".join([p for p in parts if p])
    return text


def collect_recent_links_from_home(home_url, domain_hint):
    html = http_get(home_url)
    soup = BeautifulSoup(html, "html.parser")
    links = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href:
            continue
        if href.startswith("/"):
            href = domain_hint.rstrip("/") + href
        if not href.startswith("http"):
            continue
        if domain_hint not in href:
            continue

        # heurística: evitar anchors/duplicados óbvios
        href = href.split("#")[0]
        if href in seen:
            continue
        seen.add(href)
        links.append(href)
        if len(links) >= MAX_HTML_LINKS:
            break
    return links


# =========================
# SOURCE CHECKERS
# =========================
def check_rss_source(conn, source_name, rss_url, now_tz):
    feed = feedparser.parse(rss_url)
    analyzed = 0
    discarded_not_today = 0
    no_date = 0
    notified = 0

    for entry in getattr(feed, "entries", [])[:60]:
        analyzed += 1
        title = (entry.get("title") or "").strip()
        link = (entry.get("link") or "").strip()
        guid = (entry.get("id") or entry.get("guid") or link).strip()

        published_raw = entry.get("published")  # preferir publicação; não usar updated como substituto
        published_dt = parse_datetime_aware(published_raw) if published_raw else None
        if not published_dt:
            no_date += 1
            logging.info(f"[{source_name}] sem data confiável (RSS) -> {link}")
            continue

        if not is_published_today(published_dt, now_tz):
            discarded_not_today += 1
            continue

        content = ""
        if entry.get("summary"):
            content = entry.get("summary")
        elif entry.get("content") and isinstance(entry["content"], list) and entry["content"]:
            content = entry["content"][0].get("value", "")

        match_field = None
        snippet = None

        snippet_title = find_keyword_snippet(title)
        if snippet_title:
            match_field = "título"
            snippet = snippet_title
        else:
            snippet_body = find_keyword_snippet(content)
            if snippet_body:
                match_field = "corpo"
                snippet = snippet_body

        if not match_field:
            continue

        if already_notified(conn, link, guid=guid):
            continue

        verified_at = now_tz.isoformat()
        published_local = published_dt.astimezone(TZ).isoformat()
        subject = f"📰 Notícia de HOJE encontrada (universal) – {title}"

        body = "\n".join([
            f"Site/Fonte: {source_name}",
            f"Título: {title}",
            f"Palavra-chave: {KEYWORD}",
            f"Publicado em: {published_local} ({TZ_NAME})",
            f"Verificado em: {verified_at} ({TZ_NAME})",
            f"Link: {link}",
            f"Match em: {match_field}",
            "Trecho do match:",
            snippet or "",
        ])

        send_email_alert(ALERT_TO, subject, body)
        mark_notified(conn, link, guid, source_name, title, published_local, verified_at)
        notified += 1
        logging.info(f"[{source_name}] NOTIFICADO: {title} -> {link}")

    return analyzed, discarded_not_today, no_date, notified


def check_html_source(conn, source_name, home_url, domain_hint, now_tz):
    analyzed = 0
    discarded_not_today = 0
    no_date = 0
    notified = 0

    links = collect_recent_links_from_home(home_url, domain_hint)
    for url in links:
        analyzed += 1
        try:
            html = http_get(url)
        except Exception as e:
            logging.warning(f"[{source_name}] erro ao buscar URL {url}: {e}")
            continue

        published_dt = extract_published_datetime_from_html(html)
        if not published_dt:
            no_date += 1
            logging.info(f"[{source_name}] sem data confiável (HTML) -> {url}")
            continue

        if not is_published_today(published_dt, now_tz):
            discarded_not_today += 1
            continue

        title = extract_title_from_html(html)
        body_text = extract_body_text_from_html(html)

        match_field = None
        snippet = None

        snippet_title = find_keyword_snippet(title)
        if snippet_title:
            match_field = "título"
            snippet = snippet_title
        else:
            snippet_body = find_keyword_snippet(body_text)
            if snippet_body:
                match_field = "corpo"
                snippet = snippet_body

        if not match_field:
            continue

        if already_notified(conn, url, guid=None):
            continue

        verified_at = now_tz.isoformat()
        published_local = published_dt.astimezone(TZ).isoformat()
        subject = f"📰 Notícia de HOJE encontrada (universal) – {title}"

        body = "\n".join([
            f"Site/Fonte: {source_name}",
            f"Título: {title}",
            f"Palavra-chave: {KEYWORD}",
            f"Publicado em: {published_local} ({TZ_NAME})",
            f"Verificado em: {verified_at} ({TZ_NAME})",
            f"Link: {url}",
            f"Match em: {match_field}",
            "Trecho do match:",
            snippet or "",
        ])

        send_email_alert(ALERT_TO, subject, body)
        mark_notified(conn, url, None, source_name, title, published_local, verified_at)
        notified += 1
        logging.info(f"[{source_name}] NOTIFICADO: {title} -> {url}")

    return analyzed, discarded_not_today, no_date, notified


def check_passageiro_de_primeira(conn, now_tz):
    # tenta RSS primeiro; se não render, cai para HTML
    last_err = None
    for rss in PDP_RSS_CANDIDATES:
        try:
            a, d, n, ok = check_rss_source(conn, "Passageiro de Primeira (RSS)", rss, now_tz)
            if a > 0:
                return a, d, n, ok
        except Exception as e:
            last_err = e

    logging.warning(f"[Passageiro de Primeira] RSS indisponível/ineficaz, usando HTML. Último erro RSS: {last_err}")
    return check_html_source(conn, "Passageiro de Primeira", PDP_HOME, "https://passageirodeprimeira.com", now_tz)


def check_melhores_destinos(conn, now_tz):
    try:
        return check_rss_source(conn, "Melhores Destinos (RSS)", MD_RSS, now_tz)
    except Exception as e:
        logging.warning(f"[Melhores Destinos] erro RSS: {e}; usando HTML como fallback.")
        return check_html_source(conn, "Melhores Destinos", MD_HOME, "https://www.melhoresdestinos.com.br", now_tz)


# =========================
# MAIN
# =========================
def run_cycle():
    now_tz = datetime.now(TZ)

    conn = db_connect()
    purge_old(conn, now_tz)

    sources = [
        ("Melhores Destinos", check_melhores_destinos),
        ("Passageiro de Primeira", check_passageiro_de_primeira),
    ]

    totals = {
        "analyzed": 0,
        "discarded_not_today": 0,
        "no_date": 0,
        "notified": 0,
        "failed_sources": [],
    }

    logging.info("===== ciclo iniciado =====")
    logging.info(f"Timezone: {TZ_NAME} | verificado em: {now_tz.isoformat()}")

    for name, fn in sources:
        try:
            a, d, n, ok = fn(conn, now_tz)
            totals["analyzed"] += a
            totals["discarded_not_today"] += d
            totals["no_date"] += n
            totals["notified"] += ok
            logging.info(f"[{name}] analisados={a} nao_hoje={d} sem_data={n} notificados={ok}")
        except Exception as e:
            totals["failed_sources"].append((name, str(e)))
            logging.error(f"[{name}] FALHA: {e}")

    # Retry após 10 minutos para fontes que falharam
    if totals["failed_sources"]:
        logging.warning(f"Fontes com falha: {totals['failed_sources']}. Retry em 10 minutos.")
        time.sleep(600)

        for name, fn in sources:
            # retry apenas nas que falharam
            if not any(x[0] == name for x in totals["failed_sources"]):
                continue
            try:
                a, d, n, ok = fn(conn, datetime.now(TZ))
                logging.info(f"[RETRY {name}] analisados={a} nao_hoje={d} sem_data={n} notificados={ok}")
            except Exception as e:
                logging.error(f"[RETRY {name}] FALHA: {e}")

    logging.info(
        f"RESUMO: analisados={totals['analyzed']} "
        f"nao_hoje={totals['discarded_not_today']} sem_data={totals['no_date']} "
        f"notificados={totals['notified']}"
    )
    logging.info("===== ciclo finalizado =====")
    conn.close()


if __name__ == "__main__":
    setup_logging()
    run_cycle()
