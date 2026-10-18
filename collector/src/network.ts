import { lookup } from "node:dns/promises";
import { isIP, BlockList } from "node:net";
import { Agent, fetch as httpFetch } from "undici";
import robotsParser from "robots-parser";
const blocked = new BlockList();
for (const [ip, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(ip, prefix, "ipv4");
export function publicAddress(address: string) {
  if (isIP(address) === 4) return !blocked.check(address, "ipv4");
  // Allow global unicast IPv6 only; excludes loopback, mapped IPv4, link-local, ULA.
  return (
    isIP(address) === 6 &&
    /^[23][0-9a-f]{3}:/i.test(address) &&
    !address.toLowerCase().startsWith("2001:db8:")
  );
}
export function canonicalUrl(input: string) {
  const u = new URL(input);
  if (
    !["http:", "https:"].includes(u.protocol) ||
    u.username ||
    u.password ||
    !["", "80", "443"].includes(u.port)
  )
    throw new Error("Unsafe job URL.");
  if (
    u.hostname === "localhost" ||
    u.hostname.endsWith(".local") ||
    u.hostname.endsWith(".internal") ||
    !u.hostname.includes(".")
  )
    throw new Error("Private host is not allowed.");
  if (
    isIP(u.hostname.replace(/^\[|\]$/g, "")) &&
    !publicAddress(u.hostname.replace(/^\[|\]$/g, ""))
  )
    throw new Error("Private address is not allowed.");
  u.hash = "";
  for (const key of [...u.searchParams.keys()])
    if (/^(utm_|fbclid|gclid)/i.test(key)) u.searchParams.delete(key);
  return u.href;
}
const lastRequest = new Map<string, number>();
const agent = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      lookup(hostname, { all: true })
        .then((addresses) => {
          if (
            !addresses.length ||
            addresses.some((a) => !publicAddress(a.address))
          )
            return callback(
              new Error("Private destination blocked."),
              [],
              undefined,
            );
          if (options.all) callback(null, addresses, undefined);
          else callback(null, addresses[0].address, addresses[0].family);
        })
        .catch((error) => callback(error, [], undefined));
    },
  },
});
export async function safeFetch(
  input: string,
  limit = 2_000_000,
): Promise<{ text: string; url: string; status: number; type: string }> {
  let url = canonicalUrl(input);
  for (let redirects = 0; redirects < 5; redirects++) {
    const host = new URL(url).host;
    const wait = Math.max(0, 750 - (Date.now() - (lastRequest.get(host) ?? 0)));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequest.set(host, Date.now());
    const response = await httpFetch(url, {
      dispatcher: agent,
      redirect: "manual",
      headers: { "user-agent": "AIJobRadar/1.0 (personal job research)" },
      signal: AbortSignal.timeout(20000),
    });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location");
      await response.body?.cancel();
      if (!next) throw new Error("Redirect has no destination.");
      url = canonicalUrl(new URL(next, url).href);
      continue;
    }
    if (response.status >= 400) {
      await response.body?.cancel();
      throw new Error(`Source returned HTTP ${response.status}.`);
    }
    if (Number(response.headers.get("content-length") ?? 0) > limit) {
      await response.body?.cancel();
      throw new Error("Source body exceeds size limit.");
    }
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (response.body)
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > limit) throw new Error("Source body exceeds size limit.");
        chunks.push(chunk);
      }
    return {
      text: Buffer.concat(chunks).toString("utf8"),
      url,
      status: response.status,
      type: response.headers.get("content-type") ?? "text/html",
    };
  }
  throw new Error("Too many redirects.");
}
const robots = new Map<string, ReturnType<typeof robotsParser>>();
export async function assertRobots(url: string) {
  const u = new URL(canonicalUrl(url));
  if (!robots.has(u.origin)) {
    try {
      const r = await safeFetch(u.origin + "/robots.txt", 200000);
      robots.set(u.origin, robotsParser(u.origin + "/robots.txt", r.text));
    } catch (e) {
      if (e instanceof Error && /HTTP 404/.test(e.message))
        robots.set(u.origin, robotsParser(u.origin + "/robots.txt", ""));
      else throw new Error("Could not verify source robots rules.");
    }
  }
  if (robots.get(u.origin)!.isAllowed(u.href, "AIJobRadar") === false)
    throw new Error("Source robots rules disallow this page.");
}
