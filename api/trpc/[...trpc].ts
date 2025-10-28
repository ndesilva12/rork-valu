import type { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../backend/trpc/app-router';
import { createContext } from '../../backend/trpc/create-context';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[Vercel API] Handling request:', req.method, req.url);

    // Convert Vercel request to Web Request format
    const url = new URL(
      req.url || '',
      `https://${req.headers.host || 'localhost'}`
    );

    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(',') : value);
      }
    });

    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body) {
        body = JSON.stringify(req.body);
      }
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    console.log('[Vercel API] Creating tRPC handler');

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: request,
      router: appRouter,
      createContext: async (opts) => {
        console.log('[Vercel API] Creating context');
        return createContext(opts);
      },
      onError: ({ error, path }) => {
        console.error('[Vercel API] tRPC Error:', {
          path,
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
      },
    });

    // Convert Web Response to Vercel Response
    console.log('[Vercel API] Response status:', response.status);

    res.status(response.status);

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const text = await response.text();
    res.send(text);
  } catch (error: any) {
    console.error('[Vercel API] Fatal error:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }
}
