import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = 'DWwZ2Hc5Pzh4Kjo7ns8pVrqvLgKo622DydEFZ8XHz5iy';

export const SolanaLaunchpad: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<any[]>([]);
  const [newPool, setNewPool] = useState({
    tokenMint: '',
    startTime: '',
    endTime: '',
    totalTokens: '',
    tokenPrice: '',
    minContribution: '',
    maxContribution: ''
  });

  const initializePool = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      const tokenMint = new PublicKey(newPool.tokenMint);
      const startTime = Math.floor(new Date(newPool.startTime).getTime() / 1000);
      const endTime = Math.floor(new Date(newPool.endTime).getTime() / 1000);
      
      // Create pool account
      const poolKeypair = web3.Keypair.generate();
      
      // Initialize pool instruction
      // Note: This is a placeholder. You'll need to implement the actual program interaction
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing pool:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Solana Launchpad</h1>
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {publicKey && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Pool</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Token Mint Address"
                className="border p-2 rounded"
                onChange={(e) => setNewPool({...newPool, tokenMint: e.target.value})}
              />
              <input
                type="datetime-local"
                className="border p-2 rounded"
                onChange={(e) => setNewPool({...newPool, startTime: e.target.value})}
              />
              <input
                type="datetime-local"
                className="border p-2 rounded"
                onChange={(e) => setNewPool({...newPool, endTime: e.target.value})}
              />
              <input
                type="text"
                placeholder="Total Tokens"
                className="border p-2 rounded"
                onChange={(e) => setNewPool({...newPool, totalTokens: e.target.value})}
              />
              <input
                type="text"
                placeholder="Token Price (SOL)"
                className="border p-2 rounded"
                onChange={(e) => setNewPool({...newPool, tokenPrice: e.target.value})}
              />
              <input
                type="text"
                placeholder="Min Contribution (SOL)"
                className="border p-2 rounded"
                onChange={(e) => setNewPool({...newPool, minContribution: e.target.value})}
              />
              <input
                type="text"
                placeholder="Max Contribution (SOL)"
                className="border p-2 rounded"
                onChange={(e) => setNewPool({...newPool, maxContribution: e.target.value})}
              />
              <button
                onClick={initializePool}
                disabled={loading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Pool'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Pool #{index}</h2>
                {/* Pool details will go here */}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}; 