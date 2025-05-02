import { main } from "./main.ts";

await Deno.cron("update ddns", { hour: { every: 1 } }, async () => {
  try {
    await main();
    console.log("Cron job completed successfully");
  } catch (error) {
    console.error("Error running cron job:", error);
  }
});
