import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/trpc';  // Adjust to your router path, e.g., '../../../lib/trpc'
import { createTRPCContext } from '@/lib/trpc';  // Adjust to your context path

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ error }) => console.error('TRPC Error:', error),
  });

export { handler as GET, handler as POST };
