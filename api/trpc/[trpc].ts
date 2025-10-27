import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from './router';  // Your existing router.ts
import { createTRPCContext } from '../../../lib/trpc';  // Adjust path if needed

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
    onError: ({ error }) => {
      console.error('TRPC Error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    },
  });

export { handler as GET, handler as POST };