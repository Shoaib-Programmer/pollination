// src/pages/_app.tsx
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Poppins, Luckiest_Guy } from "next/font/google"; // Import the font functions

// Configure Poppins
const poppins = Poppins({
    weight: ["400", "700"], // Load regular and bold weights
    subsets: ["latin"],
    display: "swap", // Use swap for font display strategy
    variable: "--font-poppins", // Define a CSS variable
});

// Configure Luckiest Guy
const luckiestGuy = Luckiest_Guy({
    weight: "400", // Luckiest Guy usually only has regular weight
    subsets: ["latin"],
    display: "swap",
    variable: "--font-luckiest-guy", // Define a CSS variable
});

export default function App({ Component, pageProps }: AppProps) {
    return (
        // Apply the font variables to the html element
        <main className={`${poppins.variable} ${luckiestGuy.variable}`}>
            <Component {...pageProps} />
        </main>
    );
}
