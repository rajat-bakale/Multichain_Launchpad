import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Add Polygon Amoy Chain configuration
const POLYGON_AMOY_CONFIG = {
  chainId: '80002',
  chainName: 'Polygon Amoy',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://www.oklink.com/amoy']
};

interface Web3ContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isMetaMaskInstalled: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  provider: null,
  connect: async () => {},
  disconnect: () => {},
  isMetaMaskInstalled: false,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  useEffect(() => {
    setIsMetaMaskInstalled(
      typeof window !== 'undefined' && 
      window.ethereum?.isMetaMask === true
    );
  }, []);

  const connect = async () => {
    if (!isMetaMaskInstalled) {
      window.open('https://metamask.io/download/', '_blank');
      alert('Please install MetaMask to use this feature');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum!.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Create Web3Provider with ethers v6
      const web3Provider = new ethers.BrowserProvider(window.ethereum!);
      
      // Switch to Polygon Amoy network
      try {
        await window.ethereum!.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${Number(POLYGON_AMOY_CONFIG.chainId).toString(16)}` }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum!.request({
              method: 'wallet_addEthereumChain',
              params: [{
                ...POLYGON_AMOY_CONFIG,
                chainId: `0x${Number(POLYGON_AMOY_CONFIG.chainId).toString(16)}`
              }],
            });
          } catch (addError) {
            console.error('Failed to add Polygon Amoy network:', addError);
            alert('Failed to add Polygon Amoy network. Please try again.');
            return;
          }
        } else {
          console.error('Failed to switch network:', switchError);
          alert('Failed to switch to Polygon Amoy network. Please try again.');
          return;
        }
      }

      // Get signer and address using ethers v6
      const signer = await web3Provider.getSigner();
      const address = await signer.getAddress();
      
      setProvider(web3Provider);
      setAccount(address);

      // Handle account changes
      const handleAccountsChanged = async (newAccounts: string[]) => {
        if (newAccounts.length > 0) {
          const signer = await web3Provider.getSigner();
          const address = await signer.getAddress();
          setAccount(address);
        } else {
          disconnect();
        }
      };

      // Handle chain changes
      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum!.on('accountsChanged', handleAccountsChanged as any);
      window.ethereum!.on('chainChanged', handleChainChanged);

      // Cleanup function
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged as any);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to MetaMask. Please try again.');
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
  };

  return (
    <Web3Context.Provider value={{ 
      account, 
      provider, 
      connect: connect as any, 
      disconnect,
      isMetaMaskInstalled 
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);