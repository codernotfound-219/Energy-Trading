import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load contract data
  const loadContract = async (signerInstance) => {
    try {
      console.log('Loading contract...');
      const response = await fetch('/contract.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contract.json: ${response.status} ${response.statusText}`);
      }
      
      const contractData = await response.json();
      console.log('Contract data loaded:', contractData.address);
      
      const contractInstance = new ethers.Contract(
        contractData.address,
        contractData.abi,
        signerInstance
      );
      
      console.log('Contract instance created successfully');
      setContract(contractInstance);
      return contractInstance;
    } catch (err) {
      console.error('Error loading contract:', err);
      setError(`Failed to load contract: ${err.message}. Make sure it is deployed and the blockchain is running.`);
      return null;
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to use this application.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Connecting to wallet...');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      console.log('Connected to account:', accounts[0]);

      // Create provider and signer
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await providerInstance.getSigner();

      console.log('Provider and signer created');

      // Check network
      const network = await providerInstance.getNetwork();
      console.log('Connected to network:', network.chainId.toString());

      if (network.chainId !== 1337n) {
        setError('Please switch to the local network (Chain ID: 1337) in MetaMask');
        return;
      }

      setProvider(providerInstance);
      setSigner(signerInstance);
      setAccount(accounts[0]);

      // Load contract
      const contractInstance = await loadContract(signerInstance);
      if (!contractInstance) {
        throw new Error('Failed to load contract');
      }

      console.log('Wallet connected successfully');

    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setError(null);
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          console.log('Checking existing connection...');
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            console.log('Found existing connection:', accounts[0]);
            const providerInstance = new ethers.BrowserProvider(window.ethereum);
            
            // Check network
            const network = await providerInstance.getNetwork();
            console.log('Current network:', network.chainId.toString());
            
            if (network.chainId !== 1337n) {
              setError('Please switch to the local network (Chain ID: 1337) in MetaMask');
              setIsInitialized(true);
              return;
            }
            
            const signerInstance = await providerInstance.getSigner();

            setProvider(providerInstance);
            setSigner(signerInstance);
            setAccount(accounts[0]);

            await loadContract(signerInstance);
          } else {
            console.log('No existing connection found');
          }
        } catch (err) {
          console.error('Error checking connection:', err);
          setError(`Connection check failed: ${err.message}`);
        }
      }
      setIsInitialized(true);
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const value = {
    account,
    provider,
    signer,
    contract,
    loading,
    error,
    isInitialized,
    connectWallet,
    disconnectWallet,
  };

  // Don't render children until Web3 context is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Initializing Web3...</p>
        </div>
      </div>
    );
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
