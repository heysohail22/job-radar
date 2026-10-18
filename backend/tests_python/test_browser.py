"""Fallback ordering plus opt-in real Chromium rendering of an offline JS fixture."""

import os
import pytest
from job_radar import extract as extraction
from job_radar.network import SourceError, canonical_url

URL = "https://jobs.example.com/python-role"
JD = "Requirements: Python and REST API experience. Build software from India. " * 25
HTML = '<main><h1>Python developer</h1><div id="job-description">' + JD + "</div></main>"


class Source:
    def __init__(self, content="loading"):
        self.content = content
        self.requests = []

    def assert_robots(self, url):
        canonical_url(url)

    def fetch(self, url, limit=2_000_000):
        canonical_url(url)
        self.requests.append(url)
        return {"text": self.content, "url": url, "type": "text/html"}


def test_direct_extraction_avoids_browser_and_paid_calls(monkeypatch):
    monkeypatch.setattr(extraction, "direct_api", lambda *a: None)
    from job_radar import browser

    def unexpected(*args):
        raise AssertionError("Unnecessary extraction fallback")

    monkeypatch.setattr(browser, "render", unexpected)
    result = extraction.extract(URL, Source(HTML), fallback=unexpected, enable_browser=True)
    assert result["method"] == "html"


def test_browser_success_saves_firecrawl_credit(monkeypatch):
    monkeypatch.setattr(extraction, "direct_api", lambda *a: None)
    from job_radar import browser

    monkeypatch.setattr(browser, "render", lambda *a: {"text": HTML, "url": URL})
    paid = []
    result = extraction.extract(
        URL, Source(), fallback=lambda u: paid.append(u) or JD, enable_browser=True
    )
    assert result["method"] == "playwright" and not paid


@pytest.mark.parametrize("enabled", [True, False])
def test_missing_or_disabled_browser_uses_paid_fallback(monkeypatch, enabled):
    monkeypatch.setattr(extraction, "direct_api", lambda *a: None)
    from job_radar import browser

    calls = []

    def unavailable(*args):
        calls.append("browser")
        raise SourceError("Chromium unavailable")

    monkeypatch.setattr(browser, "render", unavailable)

    def paid(url):
        calls.append("firecrawl")
        return JD

    result = extraction.extract(URL, Source(), fallback=paid, enable_browser=enabled)
    assert result["method"] == "firecrawl"
    assert calls == (["browser", "firecrawl"] if enabled else ["firecrawl"])


def test_robots_denial_prevents_all_fallbacks(monkeypatch):
    source = Source()

    def denied(url):
        raise SourceError("Robots disallow this page")

    source.assert_robots = denied
    with pytest.raises(SourceError):
        extraction.extract(
            URL,
            source,
            fallback=lambda u: pytest.fail("Must not bypass robots"),
            enable_browser=True,
        )


@pytest.mark.skipif(
    os.getenv("RUN_BROWSER_TESTS") != "1",
    reason="Requires installed Chromium and OS sandbox support",
)
def test_real_chromium_renders_js_and_blocks_private_requests():
    from job_radar.browser import render

    # All browser traffic is fulfilled in memory: no real website or local server.
    script = """<main><h1>Python developer</h1><div id="job-description"></div></main>
    <script>
    fetch('http://127.0.0.1/private');
    fetch('https://jobs.example.com/submit', {method: 'POST', body: 'blocked'});
    new WebSocket('wss://jobs.example.com/socket');
    setTimeout(() => document.querySelector('#job-description').textContent = %s, 50);
    </script>"""
    import json

    source = Source(script % json.dumps(JD))
    result = render(URL, source)
    extracted = extraction.extract_html(result["text"], result["url"])
    assert extraction.complete_description(extracted["description"])
    assert "Python" in extracted["description"]
    assert source.requests == [URL], "Private browser requests must never reach the fetcher"
