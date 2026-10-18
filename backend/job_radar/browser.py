"""Optional bounded Chromium rendering; all HTTP traffic uses the safe fetcher."""

import asyncio
from threading import BoundedSemaphore

from .network import canonical_url, SourceError

_BROWSER_SLOT = BoundedSemaphore(1)


async def render_page(url, source, timeout_seconds=35):
    from playwright.async_api import async_playwright

    url = canonical_url(url)
    async with asyncio.timeout(timeout_seconds):
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(
                headless=True,
                chromium_sandbox=True,
                args=[
                    "--disable-dev-shm-usage",
                    "--disable-background-networking",
                    "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
                    "--host-resolver-rules=MAP * ~NOTFOUND",
                ],
            )
            try:
                context = await browser.new_context(
                    service_workers="block",
                    accept_downloads=False,
                    user_agent="AIJobRadar/1.0 (personal job research)",
                )
                context.set_default_timeout(10000)

                async def close_socket(socket):
                    await socket.close()

                await context.route_web_socket("**/*", close_socket)
                count, total_bytes = 0, 0
                fetch_lock = asyncio.Lock()

                async def route_request(route):
                    nonlocal count, total_bytes
                    request = route.request
                    # Read-only extraction: no forms, POSTs, assets or child frames.
                    if (
                        request.method != "GET"
                        or request.resource_type not in ("document", "script", "xhr", "fetch")
                        or request.is_navigation_request()
                        and request.frame.parent_frame is not None
                    ):
                        await route.abort()
                        return
                    count += 1
                    if count > 60 or total_bytes >= 10_000_000:
                        await route.abort()
                        return
                    try:
                        destination = canonical_url(request.url)
                        async with fetch_lock:
                            await asyncio.to_thread(source.assert_robots, destination)
                            response = await asyncio.to_thread(source.fetch, destination, 2_000_000)
                        body = response.get("body", response["text"].encode())
                        total_bytes += len(body)
                        if total_bytes > 10_000_000:
                            raise SourceError("Browser response budget exceeded.")
                        if response["url"] != destination:
                            # Let Chromium observe the validated redirect and its true origin.
                            await route.fulfill(status=302, headers={"location": response["url"]})
                        else:
                            await route.fulfill(
                                status=200,
                                body=body,
                                content_type=response.get("type", "text/html"),
                            )
                    except Exception:
                        await route.abort()

                await context.route("**/*", route_request)
                page = await context.new_page()

                async def close_popup(popup):
                    await popup.close()

                page.on("popup", close_popup)
                await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                # Wait for client rendering without an unbounded networkidle wait.
                try:
                    await page.wait_for_function(
                        "() => { const el = document.querySelector('[data-testid=job-description],.job-description,#job-description,[itemprop=description],main,article'); return el && el.innerText.length >= 500; }",
                        timeout=7000,
                    )
                except Exception:
                    pass
                rendered = await page.content()
                if len(rendered.encode()) > 2_000_000:
                    raise SourceError("Rendered page exceeds size limit.")
                return {"text": rendered, "url": canonical_url(page.url)}
            finally:
                await browser.close()


def render(url, source):
    if not _BROWSER_SLOT.acquire(timeout=1):
        raise SourceError("Browser extraction is busy.")
    try:
        return asyncio.run(render_page(url, source))
    finally:
        _BROWSER_SLOT.release()
