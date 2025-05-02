import { main } from "./main.ts";

let lastRun = new Date(0);
let lastRunSuccess = false;

Deno.cron("update ddns", { hour: { every: 1 } }, async () => {
  try {
    await main();
    lastRunSuccess = true;
    console.log("Cron job completed successfully");
  } catch (error) {
    lastRunSuccess = false;
    console.error("Error running cron job:", error);
  } finally {
    lastRun = new Date();
  }
});

Deno.serve(() =>
  new Response(`last run: ${lastRun}\nwas successful: ${lastRunSuccess}\n`)
);
