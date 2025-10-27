import 'dotenv/config';
import app from "./hono";
import http from "http";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
// import server-side sheet helpers
import { fetchBrandFromAppsScript } from "./services/google-sheets";

const port = Number(process.env.PORT || 8081);

function makeTRPCSuccess(result: unknown) {
  return JSON.stringify({ result: { data: result } });
}

function makeTRPCError(err: any) {
  return JSON.stringify({
    error: {
      json: {
        message: err?.message ?? "Unknown error",
        code: err?.code ?? "INTERNAL_SERVER_ERROR",
        data: err?.data ?? null,
        stack: err?.stack ?? null,
      },
    },
  });
}

const server = http.createServer(async (req, res) => {
  try {
    console.log("[backend] Incoming request:", req.method, req.url, "host:", req.headers.host);

    const host = req.headers.host || `localhost:${port}`;
    const fullUrl = `http://${host}${req.url ?? "/"}`;
    const urlObj = new URL(fullUrl);

    // Intercept tRPC HTTP calls sent to /api/trpc/<procedure>
    if (urlObj.pathname.startsWith("/api/trpc/")) {
      try {
        const procPath = urlObj.pathname.replace("/api/trpc/", ""); // e.g. "data.getBrand"
        console.log("[backend] Direct tRPC call for:", procPath);

        // Read input from query param "input" (tRPC client encodes input as JSON)
        const inputRaw = urlObj.searchParams.get("input");
        let parsedInput: any = undefined;
        if (inputRaw) {
          try {
            parsedInput = JSON.parse(inputRaw);
            if (parsedInput && typeof parsedInput === "object" && "json" in parsedInput) {
              parsedInput = parsedInput.json;
            }
          } catch (e) {
            parsedInput = undefined;
          }
        }

        // --- Special-case: data.getBrand single-brand fast path via Apps Script helper ---
        if (procPath === "data.getBrand") {
          const brandId = parsedInput?.id ?? (parsedInput?.json && parsedInput.json.id) ?? null;
          if (brandId) {
            try {
              // Try to use the Apps Script single-brand helper (server-side)
              const brand = await (fetchBrandFromAppsScript as any)(String(brandId));
              // If brand is null/undefined, fall through to normal caller (so errors remain consistent)
              if (brand) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.setHeader("access-control-allow-origin", "*");
                res.end(makeTRPCSuccess(brand));
                return;
              }
            } catch (err) {
              console.warn("[backend] fetchBrandFromAppsScript failed or missing, falling back to trpc caller:", err?.message ?? err);
              // fall through to call the trpc procedure (will fetch via legacy logic)
            }
          }
        }
        // ----------------- end special-case ------------------

        // create context (use your project's createContext)
        let ctx: any = {};
        try {
          const maybeCtx = (createContext as any)();
          ctx = maybeCtx instanceof Promise ? await maybeCtx : maybeCtx;
        } catch (e) {
          ctx = {};
        }

        const caller = appRouter.createCaller(ctx ?? {});
        const parts = procPath.split("."); // e.g. ["data","getBrand"]
        let fn: any = caller as any;
        for (const p of parts) {
          fn = fn?.[p];
          if (!fn) break;
        }

        if (typeof fn !== "function") {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("access-control-allow-origin", "*");
          res.end(makeTRPCError({ message: `No procedure found on path \"${procPath}\"`, code: "NOT_FOUND" }));
          return;
        }

        const result = await fn(parsedInput);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("access-control-allow-origin", "*");
        res.end(makeTRPCSuccess(result));
        return;
      } catch (err) {
        console.error("[backend] Direct tRPC handler error:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("access-control-allow-origin", "*");
        res.end(makeTRPCError(err));
        return;
      }
    }

    // Fallback: forward to Hono app for other routes
    const request = new Request(fullUrl, {
      method: req.method,
      headers: req.headers as any,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req,
    });

    const response = await (app as any).fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (err) {
    console.error("[backend] Request handling error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
