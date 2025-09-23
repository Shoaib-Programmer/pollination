import Head from 'next/head';
import { Poppins } from 'next/font/google';
import styles from '@/styles/Home.module.css';
import dynamic from 'next/dynamic';
import { GoogleAnalytics } from '@next/third-parties/google';

const poppins = Poppins({ weight: ['400', '700'], subsets: ['latin'] });

const AppWithoutSSR = dynamic(() => import('@/App'), { ssr: false });

export default function Home() {
    return (
        <>
            <Head>
                <title>Pollination Fun!</title>
            </Head>
            <main className={`${styles.main} ${poppins.className}`}>
                <AppWithoutSSR />
            </main>
            <GoogleAnalytics gaId="G-GE1C2LW2H9" />
        </>
    );
}
