import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../backend/trpc/app-router';
import { createContext } from '../../backend/trpc/create-context';

// Use Edge Runtime which supports ES Modules natively
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    console.log('[Edge API] Handling request:', request.method, request.url);

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: async (opts) => {
        console.log('[Edge API] Creating context');
        return createContext(opts);
      },
      onError: ({ error, path }) => {
        console.error('[Edge API] tRPC Error:', {
          path,
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
      },
    });

    console.log('[Edge API] Response status:', response.status);
    return response;
  } catch (error: any) {
    console.error('[Edge API] Fatal error:', {
      message: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Internal server error',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
