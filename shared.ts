import "@std/dotenv/load";
import { Cloudflare } from "cloudflare";
import { collectAsync, nonNullable } from "./utils.ts";
import { isIPv4, isIPv6 } from "node:net";

export type DnsRecord = Cloudflare.DNS.RecordResponse & {
  zone_id: string;
};

const CLOUDFLARE_API_TOKEN = nonNullable(Deno.env.get("CLOUDFLARE_API_TOKEN"));
const CLOUDFLARE_ACCOUNT_ID = nonNullable(
  Deno.env.get("CLOUDFLARE_ACCOUNT_ID"),
);

export const cloudflare = new Cloudflare({ apiToken: CLOUDFLARE_API_TOKEN });

export async function listTunnelOrigins() {
  const tunnels = await collectAsync(
    cloudflare.zeroTrust.tunnels.cloudflared.list({
      account_id: CLOUDFLARE_ACCOUNT_ID,
    }),
  );

  const tunnelIdToIp = new Map<string, string[]>();

  tunnels.forEach((tunnel) => {
    if (tunnel.id) {
      tunnelIdToIp.set(
        tunnel.id,
        tunnel.connections
          ?.map((connection) => connection.origin_ip)
          ?.filter((originIp): originIp is string => originIp !== undefined) ??
          [],
      );
    }
  });

  return tunnelIdToIp;
}

export async function findRecords(
  domain: string,
): Promise<DnsRecord[]> {
  const zones = await collectAsync(cloudflare.zones.list());
  const zone = zones.find((zone) => domain.endsWith(zone.name));
  if (!zone) {
    throw new Error(`Zone not found for domain: ${domain}`);
  }
  const dnsRecords = await collectAsync(
    cloudflare.dns.records.list({ zone_id: zone.id }),
  );

  return dnsRecords
    .filter((record) => record.name === domain)
    .filter((record) => record.type === "A" || record.type === "AAAA")
    .map((record) => ({ ...record, zone_id: zone.id }));
}

export function extractTunnelIdToDomain(
  env: Record<string, string>,
): Map<string, string> {
  const tunnelIdToDomain = new Map<string, string>();

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("CLOUDFLARE_TUNNEL_")) {
      const tunnelId = key.slice("CLOUDFLARE_TUNNEL_".length)
        .replaceAll("_", "-");
      tunnelIdToDomain.set(tunnelId, value);
    }
  }

  return tunnelIdToDomain;
}

export async function updateRecords(
  records: DnsRecord[],
  ips: string[],
): Promise<[boolean, boolean]> {
  const ipv4Record = records.find((record) => record.type === "A");
  const ipv6Record = records.find((record) => record.type === "AAAA");
  const ipv4Ip = ips.find(isIPv4);
  const ipv6Ip = ips.find(isIPv6);

  const result: [boolean, boolean] = [false, false];

  if (ipv4Record && ipv4Ip && ipv4Record.content !== ipv4Ip) {
    await cloudflare.dns.records.edit(ipv4Record.id, {
      content: ipv4Ip,
      zone_id: ipv4Record.zone_id,
    });
    result[0] = true;
  }

  if (ipv6Record && ipv6Ip && ipv6Record.content !== ipv6Ip) {
    await cloudflare.dns.records.edit(ipv6Record.id, {
      content: ipv6Ip,
      zone_id: ipv6Record.zone_id,
    });
    result[1] = true;
  }

  return result;
}
