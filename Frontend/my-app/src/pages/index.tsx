import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { LAUNCHPAD_ABI } from '../contracts/LaunchpadABI';
import { Navigation } from '../components/Navigation';

const LAUNCHPAD_ADDRESS = '0xC9ad2061367FefbeeB60cB455021942C9f8FBDcD';

// Add input class constant at the top of the file
const inputClassName = "w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400";

export default function Home() {
  const { account, provider, connect, disconnect, isMetaMaskInstalled } = useWeb3();
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
      
      // Prepare the parameters
      const params = [
        newPool.tokenAddress,
        Math.floor(new Date(newPool.startTime).getTime() / 1000),
        Math.floor(new Date(newPool.endTime).getTime() / 1000),
        ethers.parseEther(newPool.totalTokens),
        ethers.parseEther(newPool.tokenPrice),
        ethers.parseEther(newPool.minContribution),
        ethers.parseEther(newPool.maxContribution)
      ];

      // Estimate gas first
      try {
        // const gasEstimate = await contract.createPool.estimateGas(...params);
        // console.log('Estimated gas:', gasEstimate.toString());

        // Add 20% buffer to gas estimate
        // const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

        const tx = await contract.createPool(...params);
        
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
      } catch (estimateError: any) {
        console.error('Gas estimation failed:', estimateError);
        
        // Check for common errors
        if (estimateError.message.includes('insufficient funds')) {
          alert('Insufficient funds to create pool');
        } else if (estimateError.message.includes('exceeds balance')) {
          alert('Token balance too low');
        } else if (estimateError.message.includes('allowance')) {
          alert('Token approval failed. Please try again');
        } else {
          alert('Failed to create pool. Please check your inputs and try again');
        }
      }
    } catch (error: any) {
      console.error('Error creating pool:', error);
      
      // Handle specific error messages
      if (error.message.includes('user rejected')) {
        alert('Transaction was rejected');
      } else if (error.message.includes('insufficient funds')) {
        alert('Insufficient funds to pay for gas');
      } else {
        alert(error.message || 'Error creating pool. Check console for details.');
      }
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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Ethereum Launchpad</h1>
                <p className="text-blue-100">Launch your token on Polygon Amoy Network</p>
              </div>
              {!isMetaMaskInstalled ? (
                <button
                  onClick={() => window.open('https://metamask.io/download/', '_blank')}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors duration-200 shadow-lg"
                >
                  Install MetaMask
                </button>
              ) : !account ? (
                <button
                  onClick={connect}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-lg"
                >
                  Connect MetaMask
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="bg-white/10 px-4 py-2 rounded-lg text-white">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                  <button
                    onClick={disconnect}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-lg"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {account && (
            <div className="mb-8 bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Pool</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Token Address</label>
                  <input
                    type="text"
                    placeholder="Enter token contract address"
                    className={inputClassName}
                    value={newPool.tokenAddress}
                    onChange={(e) => setNewPool({...newPool, tokenAddress: e.target.value})}
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
                  <label className="block text-sm font-medium text-gray-700">Token Price (MATIC)</label>
                  <input
                    type="text"
                    placeholder="Enter price per token"
                    className={inputClassName}
                    value={newPool.tokenPrice}
                    onChange={(e) => setNewPool({...newPool, tokenPrice: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Min Contribution (MATIC)</label>
                  <input
                    type="text"
                    placeholder="Enter minimum contribution"
                    className={inputClassName}
                    value={newPool.minContribution}
                    onChange={(e) => setNewPool({...newPool, minContribution: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Max Contribution (MATIC)</label>
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
                    onClick={createPool}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-lg font-medium"
                  >
                    Create Pool
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pools...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map((pool, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Pool #{index}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      pool.finalized ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {pool.finalized ? 'Finalized' : 'Active'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token:</span>
                      <span className="text-gray-900 font-medium">{pool.tokenAddress.slice(0, 6)}...{pool.tokenAddress.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="text-gray-900 font-medium">{ethers.formatEther(pool.tokenPrice)} MATIC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Raised:</span>
                      <span className="text-gray-900 font-medium">{ethers.formatEther(pool.totalRaised)} MATIC</span>
                    </div>
                    
                    {!pool.finalized && (
                      <div className="mt-4 space-y-3">
                        <input
                          type="text"
                          placeholder="Amount in MATIC"
                          className={inputClassName}
                          id={`contribute-${index}`}
                        />
                        <button
                          onClick={() => contribute(index, (document.getElementById(`contribute-${index}`) as HTMLInputElement).value)}
                          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                        >
                          Contribute
                        </button>
                      </div>
                    )}
                    
                    {account && !pool.finalized && (
                      <button
                        onClick={() => finalizePool(index)}
                        className="w-full mt-3 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                      >
                        Finalize Pool
                      </button>
                    )}
                    
                    {pool.finalized && (
                      <button
                        onClick={() => claimTokens(index)}
                        className="w-full mt-3 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors duration-200"
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