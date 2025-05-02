import { main } from "./main.ts";

let lastRun = new Date(0);

Deno.cron("update ddns", { hour: { every: 1 } }, async () => {
  try {
    await main();
    console.log("Cron job completed successfully");
  } catch (error) {
    console.error("Error running cron job:", error);
  } finally {
    lastRun = new Date();
  }
});

Deno.serve(() => new Response(`last run: ${lastRun}`));
