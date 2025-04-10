import Head from "next/head";
import { Poppins } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";

const poppins = Poppins({ weight: ["400", "700"], subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
    return (
        <>
            <Head>
                <title>Pollination Fun! - Phaser Game</title>{" "}
                {/* Updated Title */}
                <meta
                    name="description"
                    content="An educational game about bees, flowers, and pollination, built with Phaser and Next.js."
                />
                {/*Updated Description */}
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <main className={`${styles.main} ${poppins.className}`}>
                <AppWithoutSSR />
            </main>
        </>
    );
}
