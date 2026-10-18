"""Bounded public-only fetching; DNS is validated at connection time."""

import asyncio
import ipaddress
import socket
import time
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode, urljoin
from urllib.robotparser import RobotFileParser
import aiohttp
from aiohttp.resolver import ThreadedResolver


class SourceError(ValueError):
    pass


def public_address(address):
    try:
        ip = ipaddress.ip_address(address)
        return ip.is_global and not ip.is_multicast and not (ip.version == 6 and ip.ipv4_mapped)
    except ValueError:
        return False


def canonical_url(value):
    try:
        p = urlsplit(value)
        host = p.hostname or ""
        if (
            p.scheme not in ("http", "https")
            or p.username
            or p.password
            or p.port not in (None, 80, 443)
        ):
            raise ValueError()
        if (
            not host
            or "." not in host
            or host.endswith((".local", ".internal"))
            or host == "localhost"
        ):
            raise ValueError()
        try:
            ipaddress.ip_address(host)
        except ValueError:
            pass
        else:
            if not public_address(host):
                raise ValueError()
        query = urlencode(
            [
                (k, v)
                for k, v in parse_qsl(p.query, keep_blank_values=True)
                if not k.lower().startswith(("utm_", "fbclid", "gclid"))
            ]
        )
        return urlunsplit((p.scheme, p.netloc.lower(), p.path or "/", query, ""))
    except (ValueError, TypeError):
        raise SourceError("Unsafe job URL.") from None


class PublicResolver(ThreadedResolver):
    async def resolve(self, host, port=0, family=socket.AF_INET):
        results = await super().resolve(host, port, family)
        if not results or any(not public_address(r["host"]) for r in results):
            raise SourceError("Private destination blocked.")
        return results


class SourceClient:
    def __init__(self):
        self.last = {}
        self.robots = {}

    def fetch(self, url, limit=2_000_000):
        return asyncio.run(self._fetch(url, limit))

    async def _fetch(self, url, limit):
        url = canonical_url(url)
        connector = aiohttp.TCPConnector(resolver=PublicResolver(), use_dns_cache=False)
        async with aiohttp.ClientSession(
            connector=connector,
            trust_env=False,
            timeout=aiohttp.ClientTimeout(total=25),
            headers={"User-Agent": "AIJobRadar/1.0 (personal job research)"},
        ) as session:
            for _ in range(5):
                host = urlsplit(url).netloc
                await asyncio.sleep(max(0, 0.75 - (time.monotonic() - self.last.get(host, 0))))
                self.last[host] = time.monotonic()
                async with session.get(url, allow_redirects=False) as response:
                    if 300 <= response.status < 400:
                        if not response.headers.get("Location"):
                            raise SourceError("Redirect has no destination.")
                        url = canonical_url(urljoin(url, response.headers["Location"]))
                        continue
                    if response.status >= 400:
                        raise SourceError(f"Source returned HTTP {response.status}.")
                    if int(response.headers.get("Content-Length", 0)) > limit:
                        raise SourceError("Source body exceeds size limit.")
                    body = bytearray()
                    async for chunk in response.content.iter_chunked(65536):
                        body.extend(chunk)
                        if len(body) > limit:
                            raise SourceError("Source body exceeds size limit.")
                    return {
                        "text": body.decode("utf-8", errors="replace"),
                        "body": bytes(body),
                        "url": url,
                        "type": response.headers.get("Content-Type", "text/html"),
                    }
        raise SourceError("Too many redirects.")

    def assert_robots(self, url):
        p = urlsplit(canonical_url(url))
        origin = f"{p.scheme}://{p.netloc}"
        cached = self.robots.get(origin)
        if not cached or time.monotonic() - cached[0] > 3600:
            try:
                text = self.fetch(origin + "/robots.txt", 200000)["text"]
            except SourceError as exc:
                if "HTTP 404" not in str(exc):
                    raise SourceError("Could not verify robots rules.") from None
                text = ""
            parser = RobotFileParser()
            parser.parse(text.splitlines())
            self.robots[origin] = (time.monotonic(), parser)
        if not self.robots[origin][1].can_fetch("AIJobRadar", url):
            raise SourceError("Robots rules disallow this page.")
