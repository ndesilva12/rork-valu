import { appRouter } from "./backend/trpc/app-router";

(async () => {
  try {
    // createCaller calls procedures directly (bypasses HTTP)
    const caller = appRouter.createCaller({});
    const res = await caller.data.getBrand({ json: { id: "uber" } });
    console.log("[caller] result:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("[caller] error:", err);
    process.exit(1);
  }
})();
