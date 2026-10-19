import html
import json
import re
from urllib.parse import urlsplit, quote
from bs4 import BeautifulSoup
from .network import canonical_url, SourceError


def html_text(value):
    soup = BeautifulSoup(value or "", "html.parser")
    for tag in soup.select("script,style,nav,footer,header,noscript"):
        tag.decompose()
    return re.sub(r"[ \t]+", " ", soup.get_text("\n", strip=True)).strip()


def complete_description(text):
    return (
        len(text) >= 500
        and len(text.split()) >= 80
        and bool(
            re.search(
                r"responsibilit|requirements|qualifications|what you|you will|experience|skills|about (the )?(role|job)|apply",
                text,
                re.I,
            )
        )
        and not re.search(
            r"access denied|verify you are human|just a moment|sign in to view", text[:500], re.I
        )
    )


def board_from_url(url):
    p = urlsplit(canonical_url(url))
    parts = p.path.strip("/").split("/")
    providers = {
        "jobs.lever.co": "lever",
        "jobs.eu.lever.co": "lever-eu",
        "boards.greenhouse.io": "greenhouse",
        "job-boards.greenhouse.io": "greenhouse",
        "jobs.ashbyhq.com": "ashby",
    }
    if p.hostname in providers and parts[0]:
        return {"provider": providers[p.hostname], "board": parts[0]}
    return None


def extract_html(raw, url):
    soup = BeautifulSoup(raw, "html.parser")
    postings = []

    def walk(value):
        if isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            kind = value.get("@type")
            if kind == "JobPosting" or isinstance(kind, list) and "JobPosting" in kind:
                postings.append(value)
            if "@graph" in value:
                walk(value["@graph"])

    for tag in soup.select('script[type="application/ld+json"]'):
        try:
            walk(json.loads(tag.get_text()))
        except (ValueError, TypeError):
            pass
    if len(postings) > 1:
        raise SourceError("Multiple jobs on a listing page.")
    if postings and isinstance(postings[0].get("description"), str):
        j = postings[0]
        org = j.get("hiringOrganization") or {}
        metadata = []
        for location in (
            j.get("jobLocation", [])
            if isinstance(j.get("jobLocation"), list)
            else [j.get("jobLocation")]
        ):
            if location:
                metadata.append("Location: " + json.dumps(location, ensure_ascii=False))
        if j.get("jobLocationType"):
            metadata.append("Work mode: " + str(j["jobLocationType"]))
        if j.get("employmentType"):
            metadata.append("Employment type: " + str(j["employmentType"]))
        if j.get("applicantLocationRequirements"):
            metadata.append("Applicant location: " + json.dumps(j["applicantLocationRequirements"]))
        return dict(
            url=url,
            title=j.get("title"),
            company=org.get("name") if isinstance(org, dict) else None,
            description="\n".join(metadata + [html_text(j["description"])]),
            method="jobposting-jsonld",
        )
    section = soup.select_one(
        '[data-testid="job-description"],.job-description,#job-description,[itemprop="description"],main,article'
    )
    title = soup.select_one("h1")
    return dict(
        url=url,
        title=title.get_text(strip=True) if title else None,
        description=html_text(str(section)) if section else "",
        method="html",
    )


def direct_api(url, source):
    b = board_from_url(url)
    if not b:
        return None
    p = urlsplit(url)
    parts = p.path.strip("/").split("/")
    slug, ident = quote(b["board"], safe=""), quote(parts[-1], safe="")
    provider = b["provider"]
    if provider.startswith("lever") and len(parts) >= 2:
        origin = "https://api.eu.lever.co" if provider == "lever-eu" else "https://api.lever.co"
        j = json.loads(source.fetch(f"{origin}/v0/postings/{slug}/{ident}?mode=json")["text"])
        cat = j.get("categories") or {}
        content = [
            f"Location: {cat['location']}" if cat.get("location") else "",
            f"Employment type: {cat['commitment']}" if cat.get("commitment") else "",
            f"Work mode: {j['workplaceType']}" if j.get("workplaceType") else "",
            j.get("description") or "",
        ]
        content += [x.get("text", "") + "\n" + x.get("content", "") for x in j.get("lists", [])]
        content.append(j.get("additional") or "")
        return dict(
            url=url,
            title=j.get("text"),
            description=html_text("\n".join(content)),
            method="lever-api",
        )
    if provider == "greenhouse" and ident.isdigit():
        j = json.loads(
            source.fetch(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs/{ident}")["text"]
        )
        location = (j.get("location") or {}).get("name")
        return dict(
            url=url,
            title=j.get("title"),
            company=j.get("company_name"),
            method="greenhouse-api",
            description=(f"Location: {location}\n" if location else "")
            + html_text(html.unescape(j.get("content") or "")),
        )
    if provider == "ashby" and len(parts) >= 2:
        data = json.loads(
            source.fetch(f"https://api.ashbyhq.com/posting-api/job-board/{slug}")["text"]
        )
        for j in data.get("jobs", []):
            if urlsplit(j.get("jobUrl", "")).path == p.path:
                return dict(
                    url=url,
                    title=j.get("title"),
                    method="ashby-api",
                    description="\n".join(
                        filter(
                            None,
                            [
                                f"Location: {j['location']}" if j.get("location") else "",
                                f"Employment type: {j['employmentType']}"
                                if j.get("employmentType")
                                else "",
                                "Work mode: remote" if j.get("isRemote") else "",
                                j.get("descriptionPlain") or html_text(j.get("descriptionHtml")),
                            ],
                        )
                    ),
                )
    return None


def extract(url, source, fallback=None, *, enable_browser=False):
    url = canonical_url(url)
    p = urlsplit(url)
    if (
        (p.hostname or "").endswith("indeed.com")
        and re.search(r"-jobs\.html|/jobs$", p.path)
        or (p.hostname or "").endswith("linkedin.com")
        and "/jobs/search" in p.path
        or board_from_url(url)
        and len(p.path.strip("/").split("/")) == 1
    ):
        raise SourceError("Search/board page is not a single job description.")
    source.assert_robots(url)
    try:
        result = direct_api(url, source)
        if result and complete_description(result["description"]):
            return result
    except Exception:
        pass
    try:
        page = source.fetch(url)
        # Apply robots rules to redirected destination, too.
        source.assert_robots(page["url"])
        result = extract_html(page["text"], page["url"])
        if complete_description(result["description"]):
            return result
    except Exception:
        pass
    if enable_browser:
        try:
            from .browser import render

            page = render(url, source)
            source.assert_robots(page["url"])
            result = extract_html(page["text"], page["url"])
            if complete_description(result["description"]):
                return {**result, "method": "playwright"}
        except Exception:
            # Missing Chromium, sandbox restrictions or incomplete rendering must
            # never stop the collector or bypass its normal paid fallback budget.
            pass
    if fallback:
        text = fallback(url)
        if complete_description(text):
            return dict(url=url, description=text, method="firecrawl")
    raise SourceError("Complete JD unavailable; extraction will retry.")
