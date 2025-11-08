import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en" style={{ height: '100%', width: '100%', position: 'fixed', overflow: 'hidden' }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="rgb(3, 68, 102)" />

        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS Specific Meta Tags - CRITICAL FOR STANDALONE MODE */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Stand" />
        <link rel="apple-touch-icon" href="/icon-512.png" />

        <ScrollViewStyleReset />

        {/* Fix iOS PWA white strip at bottom */}
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            position: fixed;
            overflow: hidden;
            background-color: #111827;
            padding-bottom: env(safe-area-inset-bottom);
          }
          #root {
            height: 100%;
            width: 100%;
            position: fixed;
            overflow: auto;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
