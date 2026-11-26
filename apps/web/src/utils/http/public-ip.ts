let publicIpPromise: Promise<string> | undefined;

/** 获取浏览器所在网络的公网 IP；失败时交给服务端使用直连/代理地址。 */
export function getClientPublicIp(): Promise<string> {
  publicIpPromise ??= fetch("https://api.ipify.org?format=json", {
    signal: AbortSignal.timeout(1500),
  })
    .then(async response => {
      if (!response.ok) return "";
      const data = (await response.json()) as { ip?: unknown };
      return typeof data.ip === "string" ? data.ip.trim() : "";
    })
    .catch(() => "");

  return publicIpPromise;
}
