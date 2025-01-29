import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Web3Provider } from '../context/Web3Context';
import { SolanaProvider } from '../components/SolanaProvider';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <SolanaProvider>
        <Component {...pageProps} />
      </SolanaProvider>
    </Web3Provider>
  );
}

export default MyApp;