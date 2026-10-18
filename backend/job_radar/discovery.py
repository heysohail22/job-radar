import json
from urllib.parse import quote
from xml.etree import ElementTree
from .network import canonical_url


def search(query, store):
    s = store.db.settings
    if not s.tavily_api_key.get_secret_value():
        raise ValueError("TAVILY_API_KEY is missing.")
    store.reserve("tavily")
    response = store.db.client.post(
        "https://api.tavily.com/search",
        headers={"Authorization": "Bearer " + s.tavily_api_key.get_secret_value()},
        timeout=30,
        json={
            "query": query,
            "search_depth": "basic",
            "auto_parameters": False,
            "max_results": 10,
            "include_answer": False,
            "include_raw_content": False,
        },
    )
    response.raise_for_status()
    results = []
    for r in response.json().get("results", []):
        try:
            results.append(dict(url=canonical_url(r["url"]), title=r.get("title")))
        except ValueError:
            pass
    return results


def firecrawl(url, store):
    store.reserve("firecrawl")
    response = store.db.client.post(
        "https://api.firecrawl.dev/v2/scrape",
        timeout=45,
        headers={
            "Authorization": "Bearer " + store.db.settings.firecrawl_api_key.get_secret_value()
        },
        json={"url": canonical_url(url), "formats": ["markdown"], "onlyMainContent": True},
    )
    response.raise_for_status()
    return (response.json().get("data") or {}).get("markdown", "")


def board_jobs(provider, board, source):
    slug = quote(board, safe="")
    if provider == "greenhouse":
        data = json.loads(
            source.fetch(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs")["text"]
        )
        return [
            dict(url=j["absolute_url"], title=j["title"], company=board)
            for j in data.get("jobs", [])
        ]
    if provider in ("lever", "lever-eu"):
        origin = "https://api.eu.lever.co" if provider == "lever-eu" else "https://api.lever.co"
        data = json.loads(source.fetch(f"{origin}/v0/postings/{slug}?mode=json")["text"])
        return [dict(url=j["hostedUrl"], title=j["text"], company=board) for j in data]
    if provider == "ashby":
        data = json.loads(
            source.fetch(f"https://api.ashbyhq.com/posting-api/job-board/{slug}")["text"]
        )
        return [
            dict(url=j["jobUrl"], title=j["title"], company=board) for j in data.get("jobs", [])
        ]
    return []


def feed_jobs(source):
    data = json.loads(
        source.fetch("https://remotive.com/api/remote-jobs?category=software-dev", 10_000_000)[
            "text"
        ]
    )
    return [
        dict(url=j["url"], title=j["title"], company=j["company_name"])
        for j in data.get("jobs", [])
    ]


def rss_jobs(source):
    text = source.fetch("https://weworkremotely.com/categories/remote-programming-jobs.rss")["text"]
    # No external entity resolution; bounded source body.
    if "<!DOCTYPE" in text.upper() or "<!ENTITY" in text.upper():
        raise ValueError("RSS entities are not supported.")
    root = ElementTree.fromstring(text)
    return [
        dict(url=j.findtext("link", ""), title=j.findtext("title", ""))
        for j in root.findall(".//item")
    ]
