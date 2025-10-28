import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/backend/trpc/app-router';
import { createContext } from '@/backend/trpc/create-context';

async function handler(request: Request) {
  try {
    console.log('[API] Handling request:', request.method, request.url);

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: async (opts) => {
        console.log('[API] Creating context');
        return createContext(opts);
      },
      onError: ({ error, path }) => {
        console.error('[API] Error in tRPC handler:', {
          path,
          error: error.message,
          stack: error.stack,
          code: error.code,
        });
      },
    });

    console.log('[API] Request handled successfully');
    return response;
  } catch (error: any) {
    console.error('[API] Fatal error in handler:', {
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

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
  return handler(request);
}
