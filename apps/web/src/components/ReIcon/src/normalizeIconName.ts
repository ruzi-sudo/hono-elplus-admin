export function normalizeOfflineIconName(icon: string) {
  return icon.replace(/^([^:/]+)[/:](.+)$/, "$1:$2");
}
