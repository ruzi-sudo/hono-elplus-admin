import { isIP } from "node:net";
import type { Context } from "hono";

const CLIENT_PUBLIC_IP_HEADER = "x-client-public-ip";
const ADDRESS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const addressCache = new Map<string, { address: string; expiresAt: number }>();

type IncomingBindings = {
  incoming?: { socket?: { remoteAddress?: string } };
};

function normalizeIp(value: string | undefined): string {
  if (!value) return "";
  let ip = value.trim();
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  const zoneIndex = ip.indexOf("%");
  if (zoneIndex >= 0) ip = ip.slice(0, zoneIndex);
  if (ip.toLowerCase().startsWith("::ffff:")) ip = ip.slice(7);
  return isIP(ip) ? ip : "";
}

function isPrivateIpv4(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && octets[2] === 0) ||
    (first === 192 && second === 0 && octets[2] === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && second >= 18 && second <= 19) ||
    (first === 198 && second === 51 && octets[2] === 100) ||
    (first === 203 && second === 0 && octets[2] === 113) ||
    first >= 224
  );
}

export function isPublicIp(value: string | undefined): boolean {
  const ip = normalizeIp(value);
  if (!ip) return false;
  if (isIP(ip) === 4) return !isPrivateIpv4(ip);

  const lower = ip.toLowerCase();
  return !(
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe8") ||
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb") ||
    lower.startsWith("ff") ||
    lower.startsWith("2001:db8:")
  );
}

function firstHeaderIp(value: string | undefined, publicOnly = false): string {
  return value
    ?.split(",")
    .map((item) => normalizeIp(item))
    .find((ip) => ip && (!publicOnly || isPublicIp(ip))) || "";
}

/**
 * 获取请求方 IP。
 *
 * 直连部署不信任客户端可伪造的 X-Forwarded-For，仅接受浏览器通过公网 IP
 * 服务探测后发送的 X-Client-Public-IP；反向代理部署需显式设置 TRUST_PROXY=true。
 */
export function getClientIp(c: Context): string {
  const trustedProxy = process.env.TRUST_PROXY === "true";
  const forwardedIp = firstHeaderIp(c.req.header("x-forwarded-for"));
  const forwardedPublicIp = firstHeaderIp(c.req.header("x-forwarded-for"), true);
  const publicIp = normalizeIp(c.req.header(CLIENT_PUBLIC_IP_HEADER));

  if (trustedProxy) {
    if (forwardedPublicIp) return forwardedPublicIp;
    if (publicIp && isPublicIp(publicIp)) return publicIp;
    if (forwardedIp) return forwardedIp;

    const proxyIp =
      normalizeIp(c.req.header("cf-connecting-ip")) ||
      normalizeIp(c.req.header("true-client-ip")) ||
      normalizeIp(c.req.header("x-real-ip"));
    if (proxyIp) return proxyIp;
  } else if (publicIp && isPublicIp(publicIp)) {
    return publicIp;
  }

  const remoteIp = normalizeIp(
    (c.env as IncomingBindings | undefined)?.incoming?.socket?.remoteAddress,
  );
  return remoteIp || "127.0.0.1";
}

/** 通过 HTTPS 查询公网 IP 归属地，并在进程内短暂缓存结果。 */
export async function lookupIpAddress(ip: string): Promise<string> {
  const normalizedIp = normalizeIp(ip);
  if (!isPublicIp(normalizedIp)) return "";

  const cached = addressCache.get(normalizedIp);
  if (cached && cached.expiresAt > Date.now()) return cached.address;

  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(normalizedIp)}`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!response.ok) return "";

    const data = (await response.json()) as {
      success?: boolean;
      country?: string;
      region?: string;
      city?: string;
    };
    const address = data.success
      ? [data.country, data.region, data.city].filter(Boolean).join("")
      : "";
    if (address) {
      addressCache.set(normalizedIp, {
        address,
        expiresAt: Date.now() + ADDRESS_CACHE_TTL_MS,
      });
    }
    return address;
  } catch {
    return "";
  }
}
