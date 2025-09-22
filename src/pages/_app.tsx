import '@/styles/globals.css';
import type { AppProps } from 'next/app';

import { Poppins, Luckiest_Guy } from 'next/font/google'; // Import the font functions
import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';

// Configure Poppins
const poppins = Poppins({
    weight: ['400', '700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-poppins-family',
});

// Configure Luckiest Guy
const luckiestGuy = Luckiest_Guy({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-luckiest-guy-family',
});

export const metadata: Metadata = {
    title: 'Pollination Fun!',
    description: 'An educational game about bees, flowers, and pollination.',
    applicationName: 'Honey Helpers',
    openGraph: {
        siteName: 'Honey Helpers',
    },
    icons: '/favicon.png',
};

export default function App({ Component, pageProps }: AppProps) {
    return (
        // Apply the font variables to the html element
        <main className={`${poppins.variable} ${luckiestGuy.variable}`}>
            <Component {...pageProps} />
            <GoogleAnalytics gaId="G-GE1C2LW2H9" />
        </main>
    );
}
