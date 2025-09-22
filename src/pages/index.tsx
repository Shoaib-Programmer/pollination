import { Poppins } from 'next/font/google';
import styles from '@/styles/Home.module.css';
import dynamic from 'next/dynamic';

const poppins = Poppins({ weight: ['400', '700'], subsets: ['latin'] });

const AppWithoutSSR = dynamic(() => import('@/App'), { ssr: false });

export default function Home() {
    return (
        <main className={`${styles.main} ${poppins.className}`}>
            <AppWithoutSSR />
        </main>
    );
}
