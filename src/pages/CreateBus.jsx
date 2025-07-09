import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const CreateBus = () => {
  const { contract, account } = useWeb3();
  const [busFormData, setBusFormData] = useState({
    name: '',
    owners: '',
    capacity: '',
    basePrice: ''
  });
  const [creatingBus, setCreatingBus] = useState(false);
  const [lastTxHash, setLastTxHash] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBusFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fillDemoData = () => {
    setBusFormData({
      name: 'Solar Farm Demo',
      owners: '',
      capacity: '10000',
      basePrice: '0.001'
    });
  };

  const createBusSimple = async () => {
    if (!contract || !account) return;
    
    const { name, owners, capacity, basePrice } = busFormData;
    
    try {
      setCreatingBus(true);
      console.log('Trying simple bus creation...');
      
      // Validate inputs
      if (!name || !capacity || !basePrice) {
        alert('Please fill in all required fields (Name, Capacity, Base Price)');
        return;
      }
      
      if (parseFloat(capacity) <= 0 || parseFloat(basePrice) <= 0) {
        alert('Capacity and Base Price must be positive numbers');
        return;
      }
      
      // Prepare data
      let ownerAddresses = [account];
      if (owners.trim()) {
        const additionalOwners = owners.split(',').map(addr => addr.trim()).filter(addr => addr !== '');
        ownerAddresses = [...additionalOwners, account];
      }
      
      const basePriceInWei = ethers.parseEther(basePrice.toString());
      
      console.log('Simple call params:', {
        name,
        ownerAddresses,
        capacity: parseInt(capacity),
        basePrice: basePriceInWei.toString()
      });
      
      console.log('About to call createEnergyBus...');
      
      // Check if MetaMask is ready
      if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask detected');
        console.log('Selected account:', await window.ethereum.request({ method: 'eth_accounts' }));
        console.log('Current network:', await window.ethereum.request({ method: 'net_version' }));
      } else {
        console.log('MetaMask not detected');
      }
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Transaction timeout after 15 seconds'));
        }, 15000);
      });
      
      // Create the transaction promise
      console.log('About to create transaction promise...');
      const transactionPromise = contract.createEnergyBus(
        name,
        ownerAddresses,
        parseInt(capacity),
        basePriceInWei,
        { gasLimit: 500000 } // Set manual gas limit
      );
      
      console.log('Transaction promise created, waiting for MetaMask...');
      console.log('*** CHECK METAMASK FOR TRANSACTION POPUP ***');
      
      // Race between transaction and timeout
      const tx = await Promise.race([transactionPromise, timeoutPromise]);
      
      console.log('Simple transaction sent:', tx.hash);
      setLastTxHash(tx.hash);
      
      alert(`Transaction submitted successfully! Hash: ${tx.hash}`);
      setBusFormData({ name: '', owners: '', capacity: '', basePrice: '' });
      
      // Wait for confirmation in background
      tx.wait().then(receipt => {
        console.log('Transaction confirmed:', receipt);
        alert('Bus created successfully!');
      }).catch(err => {
        console.error('Confirmation error:', err);
      });
      
    } catch (err) {
      console.error('Simple creation failed:', err);
      
      if (err.message.includes('circuit breaker')) {
        alert(`MetaMask circuit breaker is active! Please:
1. Close and reopen MetaMask
2. Wait 30 seconds
3. Try the transaction again`);
      } else if (err.message.includes('timeout')) {
        alert(`Transaction timed out. This might be because:
1. MetaMask didn't show the transaction popup
2. The transaction is taking too long
3. Network issues

Try again and watch for the MetaMask popup.`);
      } else {
        alert(`Error: ${err.message}`);
      }
    } finally {
      setCreatingBus(false);
    }
  };

  const testContract = async () => {
    if (!contract) {
      alert('Contract not loaded');
      return;
    }
    
    try {
      console.log('Testing contract connection...');
      const busCount = await contract.getBusCount();
      console.log('Current bus count:', busCount.toString());
      
      alert(`Contract is working! Current bus count: ${busCount.toString()}`);
    } catch (err) {
      console.error('Contract test failed:', err);
      alert(`Contract test failed: ${err.message}`);
    }
  };

  const testBlockchain = async () => {
    try {
      console.log('Testing blockchain connectivity...');
      
      // Test provider connection
      const provider = new ethers.JsonRpcProvider('http://localhost:8545');
      const network = await provider.getNetwork();
      console.log('Network:', network);
      
      // Test latest block
      const blockNumber = await provider.getBlockNumber();
      console.log('Latest block:', blockNumber);
      
      // Test account balance
      const balance = await provider.getBalance(account);
      console.log('Account balance:', ethers.formatEther(balance));
      
      alert(`Blockchain is responding! Block: ${blockNumber}, Balance: ${ethers.formatEther(balance)} ETH`);
    } catch (err) {
      console.error('Blockchain test failed:', err);
      alert(`Blockchain test failed: ${err.message}`);
    }
  };

  const testMetaMask = async () => {
    try {
      console.log('Testing MetaMask connectivity...');
      
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed!');
        return;
      }
      
      // Wait a moment to let any previous requests settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to reconnect/refresh the connection
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (connectError) {
        console.log('Connection request failed:', connectError);
      }
      
      // Check accounts with a timeout
      const accountsPromise = window.ethereum.request({ method: 'eth_accounts' });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('MetaMask request timeout')), 5000);
      });
      
      const accounts = await Promise.race([accountsPromise, timeoutPromise]);
      console.log('MetaMask accounts:', accounts);
      
      if (accounts.length === 0) {
        alert('No accounts found in MetaMask. Please connect your wallet.');
        return;
      }
      
      // Check network with timeout
      const networkPromise = window.ethereum.request({ method: 'net_version' });
      const networkTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Network request timeout')), 5000);
      });
      
      const networkId = await Promise.race([networkPromise, networkTimeoutPromise]);
      console.log('MetaMask network ID:', networkId);
      
      // Check chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('MetaMask chain ID:', chainId);
      
      alert(`MetaMask is working! 
Network: ${networkId} (Chain: ${chainId})
Account: ${accounts[0]}
✅ Circuit breaker is now reset!`);
      
    } catch (err) {
      console.error('MetaMask test failed:', err);
      
      if (err.message.includes('circuit breaker')) {
        alert(`MetaMask circuit breaker is active. Please:
1. Close and reopen MetaMask
2. Wait 30 seconds
3. Try again
4. If that doesn't work, restart your browser`);
      } else {
        alert(`MetaMask test failed: ${err.message}`);
      }
    }
  };

  const resetMetaMask = async () => {
    try {
      console.log('Attempting to reset MetaMask connection...');
      
      // Clear any pending requests
      if (window.ethereum) {
        // Request accounts to refresh the connection
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        alert('MetaMask connection reset! You can now try the transaction again.');
      } else {
        alert('MetaMask not detected');
      }
    } catch (error) {
      console.error('Reset failed:', error);
      alert(`Reset failed: ${error.message}. Please manually close and reopen MetaMask.`);
    }
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Energy Bus</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
          Please connect your wallet to create an energy bus
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Energy Bus</h1>
        <p className="text-gray-600">Create a new energy bus to facilitate energy trading</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Bus Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus Name *
              </label>
              <input
                type="text"
                name="name"
                value={busFormData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-energy-blue"
                placeholder="e.g., Solar Farm Alpha"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Owners (optional)
              </label>
              <input
                type="text"
                name="owners"
                value={busFormData.owners}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-energy-blue"
                placeholder="Comma-separated Ethereum addresses"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter additional owner addresses separated by commas. You will automatically be added as an owner.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Capacity (Wh) *
              </label>
              <input
                type="number"
                name="capacity"
                value={busFormData.capacity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-energy-blue"
                placeholder="e.g., 10000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price (ETH per Wh) *
              </label>
              <input
                type="number"
                name="basePrice"
                value={busFormData.basePrice}
                onChange={handleInputChange}
                step="0.000001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-energy-blue"
                placeholder="e.g., 0.001"
                required
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              onClick={createBusSimple}
              disabled={creatingBus}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingBus ? 'Creating Bus...' : 'Create Energy Bus'}
            </button>
            
            <button
              onClick={fillDemoData}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Fill Demo Data
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Debug Tools</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={testContract}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Test Contract
              </button>
              <button
                onClick={testBlockchain}
                className="px-3 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600"
              >
                Test Blockchain
              </button>
              <button
                onClick={testMetaMask}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
              >
                Test MetaMask
              </button>
              <button
                onClick={resetMetaMask}
                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Reset MetaMask
              </button>
            </div>
          </div>

          {lastTxHash && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Last transaction: <span className="font-mono">{lastTxHash}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBus;
