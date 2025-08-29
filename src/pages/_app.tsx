// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Poppins, Luckiest_Guy } from "next/font/google"; // Import the font functions

// Configure Poppins
const poppins = Poppins({
    weight: ["400", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-poppins-family",
});

// Configure Luckiest Guy
const luckiestGuy = Luckiest_Guy({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-luckiest-guy-family",
});

export default function App({ Component, pageProps }: AppProps) {
    return (
        // Apply the font variables to the html element
        <main className={`${poppins.variable} ${luckiestGuy.variable}`}>
            <Component {...pageProps} />
        </main>
    );
}
