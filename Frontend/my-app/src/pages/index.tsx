import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { LAUNCHPAD_ABI } from '../contracts/LaunchpadABI';
import { Navigation } from '../components/Navigation';

const LAUNCHPAD_ADDRESS = '0xDe222A5d8E9Ee6f78c8a7b737995250Cc6231612';

export default function Home() {
  const { account, provider, connect, isMetaMaskInstalled } = useWeb3();
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPool, setNewPool] = useState({
    tokenAddress: '',
    startTime: '',
    endTime: '',
    totalTokens: '',
    tokenPrice: '',
    minContribution: '',
    maxContribution: ''
  });

  const loadPools = async () => {
    if (!provider) return;
    
    setLoading(true);
    try {
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, provider);
      const poolCount = await contract.poolCount();
      
      const poolsData = [];
      for (let i = 0; i < poolCount; i++) {
        const pool = await contract.pools(i);
        poolsData.push(pool);
      }
      
      setPools(poolsData);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const createPool = async () => {
    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
      
      // Validate inputs
      if (!newPool.tokenAddress || !ethers.isAddress(newPool.tokenAddress)) {
        alert('Please enter a valid token address');
        return;
      }
      
      if (!newPool.startTime || !newPool.endTime) {
        alert('Please select start and end times');
        return;
      }

      if (!newPool.totalTokens || !newPool.tokenPrice || !newPool.minContribution || !newPool.maxContribution) {
        alert('Please fill in all token details');
        return;
      }

      // First approve the token transfer
      const tokenContract = new ethers.Contract(
        newPool.tokenAddress,
        ['function approve(address spender, uint256 amount) public returns (bool)'],
        signer
      );

      console.log('Approving tokens...');
      const approveTx = await tokenContract.approve(
        LAUNCHPAD_ADDRESS,
        ethers.parseEther(newPool.totalTokens)
      );
      await approveTx.wait();
      console.log('Tokens approved');
      
      console.log('Creating pool with params:', {
        tokenAddress: newPool.tokenAddress,
        startTime: Math.floor(new Date(newPool.startTime).getTime() / 1000),
        endTime: Math.floor(new Date(newPool.endTime).getTime() / 1000),
        totalTokens: ethers.parseEther(newPool.totalTokens),
        tokenPrice: ethers.parseEther(newPool.tokenPrice),
        minContribution: ethers.parseEther(newPool.minContribution),
        maxContribution: ethers.parseEther(newPool.maxContribution)
      });

      const tx = await contract.createPool(
        newPool.tokenAddress,
        Math.floor(new Date(newPool.startTime).getTime() / 1000),
        Math.floor(new Date(newPool.endTime).getTime() / 1000),
        ethers.parseEther(newPool.totalTokens),
        ethers.parseEther(newPool.tokenPrice),
        ethers.parseEther(newPool.minContribution),
        ethers.parseEther(newPool.maxContribution)
      );
      
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Pool created successfully');
      
      // Reset form and reload pools
      setNewPool({
        tokenAddress: '',
        startTime: '',
        endTime: '',
        totalTokens: '',
        tokenPrice: '',
        minContribution: '',
        maxContribution: ''
      });
      
      loadPools();
    } catch (error: any) {
      console.error('Error creating pool:', error);
      alert(error.message || 'Error creating pool. Check console for details.');
    }
  };

  const contribute = async (poolId: number, amount: string) => {
    if (!provider || !account) return;
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
      
      const tx = await contract.contribute(poolId, {
        value: ethers.parseEther(amount)
      });
      
      await tx.wait();
      loadPools();
    } catch (error) {
      console.error(error);
    }
  };

  const finalizePool = async (poolId: number) => {
    if (!provider || !account) return;
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
      
      const tx = await contract.finalizePool(poolId);
      await tx.wait();
      loadPools();
    } catch (error) {
      console.error(error);
    }
  };

  const claimTokens = async (poolId: number) => {
    if (!provider || !account) return;
    
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LAUNCHPAD_ADDRESS, LAUNCHPAD_ABI, signer);
      
      const tx = await contract.claimTokens(poolId);
      await tx.wait();
      loadPools();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (provider) {
      loadPools();
    }
  }, [provider]);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Ethereum Launchpad (Polygon Amoy)</h1>
              {!isMetaMaskInstalled ? (
                <button
                  onClick={() => window.open('https://metamask.io/download/', '_blank')}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                >
                  Install MetaMask
                </button>
              ) : !account ? (
                <button
                  onClick={connect}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Connect MetaMask
                </button>
              ) : (
                <span className="text-gray-600">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              )}
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {account && (
            <div className="mb-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Pool</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Token Address"
                  className="border p-2 rounded"
                  value={newPool.tokenAddress}
                  onChange={(e) => setNewPool({...newPool, tokenAddress: e.target.value})}
                />
                <input
                  type="datetime-local"
                  className="border p-2 rounded"
                  value={newPool.startTime}
                  onChange={(e) => setNewPool({...newPool, startTime: e.target.value})}
                />
                <input
                  type="datetime-local"
                  className="border p-2 rounded"
                  value={newPool.endTime}
                  onChange={(e) => setNewPool({...newPool, endTime: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Total Tokens"
                  className="border p-2 rounded"
                  value={newPool.totalTokens}
                  onChange={(e) => setNewPool({...newPool, totalTokens: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Token Price (MATIC)"
                  className="border p-2 rounded"
                  value={newPool.tokenPrice}
                  onChange={(e) => setNewPool({...newPool, tokenPrice: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Min Contribution (MATIC)"
                  className="border p-2 rounded"
                  value={newPool.minContribution}
                  onChange={(e) => setNewPool({...newPool, minContribution: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Max Contribution (MATIC)"
                  className="border p-2 rounded"
                  value={newPool.maxContribution}
                  onChange={(e) => setNewPool({...newPool, maxContribution: e.target.value})}
                />
                <button
                  onClick={createPool}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Create Pool
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
                  <div className="space-y-2">
                    <p>Token: {pool.tokenAddress}</p>
                    <p>Price: {ethers.formatEther(pool.tokenPrice)} MATIC</p>
                    <p>Total Raised: {ethers.formatEther(pool.totalRaised)} MATIC</p>
                    <p>Status: {pool.finalized ? 'Finalized' : 'Active'}</p>
                    
                    {!pool.finalized && (
                      <div className="mt-4 space-y-2">
                        <input
                          type="text"
                          placeholder="Amount in MATIC"
                          className="w-full border p-2 rounded"
                          id={`contribute-${index}`}
                        />
                        <button
                          onClick={() => contribute(index, (document.getElementById(`contribute-${index}`) as HTMLInputElement).value)}
                          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                        >
                          Contribute
                        </button>
                      </div>
                    )}
                    
                    {account && !pool.finalized && (
                      <button
                        onClick={() => finalizePool(index)}
                        className="w-full mt-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                      >
                        Finalize Pool
                      </button>
                    )}
                    
                    {pool.finalized && (
                      <button
                        onClick={() => claimTokens(index)}
                        className="w-full mt-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
                      >
                        Claim Tokens
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}