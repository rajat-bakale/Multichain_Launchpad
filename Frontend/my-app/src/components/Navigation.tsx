import { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export const Navigation: FC = () => {
  const router = useRouter();
  
  return (
    <div className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex space-x-4">
          <Link 
            href="/"
            className={`px-3 py-2 rounded-md ${
              router.pathname === '/' ? 'bg-gray-900' : 'hover:bg-gray-700'
            }`}
          >
            Ethereum Launchpad
          </Link>
          <Link 
            href="/solana"
            className={`px-3 py-2 rounded-md ${
              router.pathname === '/solana' ? 'bg-gray-900' : 'hover:bg-gray-700'
            }`}
          >
            Solana Launchpad
          </Link>
        </div>
      </div>
    </div>
  );
}; 