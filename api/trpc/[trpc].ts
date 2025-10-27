import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../backend/trpc/app-router';
import { createContext } from '../../backend/trpc/create-context';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

export default async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              ``❌ tRPC failed on `${path ?? '<no-path>'}: `${error.message}``
            );
          }
        : undefined,
  });
}