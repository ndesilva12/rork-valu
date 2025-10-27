import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { verifyToken } from "@clerk/backend";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get("authorization");
  let userId: string | null = null;

  if (authHeader && CLERK_SECRET_KEY) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const verified = await verifyToken(token, {
        secretKey: CLERK_SECRET_KEY,
        authorizedParties: [CLERK_PUBLISHABLE_KEY || ""],
      });
      userId = verified.sub;
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  }

  return {
    req: opts.req,
    userId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
