import 'dotenv/config';

import http from "http";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const port = Number(process.env.PORT || 8081);

function makeTRPCSuccess(result: unknown) {
  return JSON.stringify({ result: { data: result } });
}

function makeTRPCError(err: any) {
  // Minimal tRPC error envelope - include message and code if available.
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

        // tRPC client encodes input as the 'input' query param JSON (often { json: <actual> })
        const inputRaw = urlObj.searchParams.get("input");
        let parsedInput: any = undefined;
        if (inputRaw) {
          try {
            parsedInput = JSON.parse(inputRaw);
            // If the client wrapped the real input in { json: ... }, unwrap it
            if (parsedInput && typeof parsedInput === "object" && "json" in parsedInput) {
              parsedInput = parsedInput.json;
            }
          } catch (e) {
            // Malformed input JSON
            parsedInput = undefined;
          }
        }

        // create context (some createContext implementations accept args; call without args)
        let ctx: any = {};
        try {
          // If createContext returns a Promise, await it.
          const maybeCtx = (createContext as any)();
          ctx = maybeCtx instanceof Promise ? await maybeCtx : maybeCtx;
        } catch (e) {
          // Fallback to empty ctx
          ctx = {};
        }

        const caller = appRouter.createCaller(ctx ?? {});
        // Resolve procedure path dynamically: e.g. "data.getBrand"
        const parts = procPath.split(".");
        let fn: any = caller as any;
        for (const p of parts) {
          fn = fn?.[p];
          if (!fn) break;
        }

        if (typeof fn !== "function") {
          // Procedure not found
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(makeTRPCError({ message: `No procedure found on path "${procPath}"`, code: "NOT_FOUND" }));
          return;
        }

        // Call the procedure with parsedInput (or undefined)
        const result = await fn(parsedInput);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        // Minimal CORS header used previously by Hono
        res.setHeader("access-control-allow-origin", "*");
        res.end(makeTRPCSuccess(result));
        return;
      } catch (err) {
        console.error("[backend] Direct tRPC handler error:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(makeTRPCError(err));
        return;
      }
    }
if (urlObj.pathname === "/api/product" && urlObj.searchParams.has("id")) {
  const id = urlObj.searchParams.get("id");

  const caller = appRouter.createCaller(await createContext());
  const result = await caller.data.getBrand({ id });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("access-control-allow-origin", "*");
  res.end(JSON.stringify(result));
  return;
}
    // Fallback: forward to Hono app
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

