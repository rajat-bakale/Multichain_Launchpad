import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

const PROGRAM_ID = 'DWwZ2Hc5Pzh4Kjo7ns8pVrqvLgKo622DydEFZ8XHz5iy';

// Update the input classes to include text color
const inputClassName = "w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400";

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

  const validateSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  const initializePool = async () => {
    if (!publicKey) return;
    
    try {
      // Validate token mint address
      if (!validateSolanaAddress(newPool.tokenMint)) {
        alert('Please enter a valid Solana token mint address');
        return;
      }

      setLoading(true);
      const tokenMint = new PublicKey(newPool.tokenMint);
      const startTime = Math.floor(new Date(newPool.startTime).getTime() / 1000);
      const endTime = Math.floor(new Date(newPool.endTime).getTime() / 1000);
      
      // Validate other inputs
      if (!newPool.startTime || !newPool.endTime) {
        alert('Please select start and end times');
        setLoading(false);
        return;
      }

      if (!newPool.totalTokens || isNaN(Number(newPool.totalTokens))) {
        alert('Please enter a valid token amount');
        setLoading(false);
        return;
      }

      if (!newPool.tokenPrice || isNaN(Number(newPool.tokenPrice))) {
        alert('Please enter a valid token price');
        setLoading(false);
        return;
      }

      if (!newPool.minContribution || isNaN(Number(newPool.minContribution))) {
        alert('Please enter a valid minimum contribution');
        setLoading(false);
        return;
      }

      if (!newPool.maxContribution || isNaN(Number(newPool.maxContribution))) {
        alert('Please enter a valid maximum contribution');
        setLoading(false);
        return;
      }
      
      // Create pool account
      const poolKeypair = web3.Keypair.generate();
      
      // Initialize pool instruction
      // Note: This is a placeholder. You'll need to implement the actual program interaction
      
      setLoading(false);
      
      // Reset form after successful creation
      setNewPool({
        tokenMint: '',
        startTime: '',
        endTime: '',
        totalTokens: '',
        tokenPrice: '',
        minContribution: '',
        maxContribution: ''
      });
      
    } catch (error) {
      console.error('Error initializing pool:', error);
      alert('Failed to create pool. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Solana Launchpad</h1>
              <p className="text-purple-100">Launch your token on Solana Network</p>
            </div>
            <WalletMultiButton className="!bg-purple-500 hover:!bg-purple-600 transition-colors duration-200 shadow-lg" />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {publicKey && (
          <div className="mb-8 bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Pool</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Token Mint Address</label>
                <input
                  type="text"
                  placeholder="Enter token mint address"
                  className={inputClassName}
                  value={newPool.tokenMint}
                  onChange={(e) => setNewPool({...newPool, tokenMint: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time (Your Local Time)
                </label>
                <input
                  id="startTime"
                  type="datetime-local"
                  className={inputClassName}
                  value={newPool.startTime}
                  onChange={(e) => setNewPool({...newPool, startTime: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time (Your Local Time)
                </label>
                <input
                  id="endTime"
                  type="datetime-local"
                  className={inputClassName}
                  value={newPool.endTime}
                  onChange={(e) => setNewPool({...newPool, endTime: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Total Tokens</label>
                <input
                  type="text"
                  placeholder="Enter total token amount"
                  className={inputClassName}
                  value={newPool.totalTokens}
                  onChange={(e) => setNewPool({...newPool, totalTokens: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Token Price (SOL)</label>
                <input
                  type="text"
                  placeholder="Enter price per token"
                  className={inputClassName}
                  value={newPool.tokenPrice}
                  onChange={(e) => setNewPool({...newPool, tokenPrice: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Min Contribution (SOL)</label>
                <input
                  type="text"
                  placeholder="Enter minimum contribution"
                  className={inputClassName}
                  value={newPool.minContribution}
                  onChange={(e) => setNewPool({...newPool, minContribution: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Max Contribution (SOL)</label>
                <input
                  type="text"
                  placeholder="Enter maximum contribution"
                  className={inputClassName}
                  value={newPool.maxContribution}
                  onChange={(e) => setNewPool({...newPool, maxContribution: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={initializePool}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-800 transition-all duration-200 shadow-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Pool'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pools...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Pool #{index}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    pool.finalized ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {pool.finalized ? 'Finalized' : 'Active'}
                  </span>
                </div>
                {/* Pool details will be implemented when available */}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}; 