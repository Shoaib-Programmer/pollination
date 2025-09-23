import { Html, Head, Main, NextScript } from 'next/document';
import { GoogleAnalytics } from '@next/third-parties/google';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <title>Pollination Fun!</title>
                <meta name="description" content="An educational game about bees, flowers, and pollination." />
                <meta name="application-name" content="Honey Helpers" />
                <meta property="og:site_name" content="Honey Helpers" />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
            <GoogleAnalytics gaId="G-GE1C2LW2H9" />
        </Html>
    );
}
