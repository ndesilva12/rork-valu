import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  // Match this color to your dark theme background (from darkColors.background)
  const appBackground = '#0b1720';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no"
        />

        {/* PWA Configuration */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={appBackground} />

        {/* iOS Specific Meta Tags - CRITICAL FOR STANDALONE MODE */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Valu" />
        <link rel="apple-touch-icon" href="/assets/images/icon.png" />

        {/* Force the document background to be the app background and ensure it fills the viewport.
            This prevents a white strip under the app in PWA/standalone modes. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root, html, body, #root {
              height: 100%;
              min-height: 100%;
              background: ${appBackground} !important;
            }
            body {
              margin: 0;
              -webkit-tap-highlight-color: transparent;
              background-color: ${appBackground} !important;
              color-scheme: dark;
            }
            /* Make sure no default margins/paddings or unexpected scroll gaps exist */
            html, body {
              padding: 0;
            }
            /* Ensure the safe-area env vars don't introduce unexpected layout shifts */
            /* optional: you can add an explicit CSS variable for safe-area-bottom if desired */
            `,
          }}
        />

        <ScrollViewStyleReset />
      </head>

      <body>{children}</body>
    </html>
  );
}
