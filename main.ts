import {
  extractTunnelIdToDomain,
  findRecords,
  listTunnelOrigins,
  updateRecords,
} from "./shared.ts";

const tunnelIdToDomain = extractTunnelIdToDomain(Deno.env.toObject());

export async function main() {
  const tunnels = await listTunnelOrigins();

  for (const [tunnelId, domain] of tunnelIdToDomain) {
    const ips = tunnels.get(tunnelId);
    if (!ips) {
      console.error(
        `Skipping tunnel ${tunnelId} because it is not in the list of tunnels`,
      );
      continue;
    }

    const records = await findRecords(domain);
    console.log("Updating", records, ips);

    const [v4updated, v6updated] = await updateRecords(records, ips);
    if (v4updated) {
      console.log("Updated IPv4 records");
    }
    if (v6updated) {
      console.log("Updated IPv6 records");
    }
    if (!v4updated && !v6updated) {
      console.log("No records updated");
    }
  }
}

if (import.meta.main) {
  await main();
}
