import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <meta name="description" content="An educational game about bees, flowers, and pollination." />
                {/* Ensure proper viewport and safe-area support on mobile */}
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="application-name" content="Honey Helpers" />
                <meta property="og:site_name" content="Honey Helpers" />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}