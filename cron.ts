import { main } from "./main.ts";

await Deno.cron("update ddns", { hour: { every: 1 } }, main);
