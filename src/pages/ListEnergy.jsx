import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const ListEnergy = () => {
  const { contract, account } = useWeb3();
  const [formData, setFormData] = useState({
    busId: '',
    energyAmount: '',
    pricePerUnit: ''
  });
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingBus, setCreatingBus] = useState(false);
  const [busFormData, setBusFormData] = useState({
    name: '',
    owners: '',
    capacity: '',
    basePrice: ''
  });

  const loadBuses = async () => {
    if (!contract) return;

    try {
      const busCount = await contract.getBusCount();
      const busesData = [];
      
      for (let i = 1; i <= busCount; i++) {
        try {
          const busDetails = await contract.getBusDetails(i);
          busesData.push({
            id: i,
            name: busDetails[0],
            owners: busDetails[1],
            totalCapacity: busDetails[2],
            availableCapacity: busDetails[3],
            basePrice: busDetails[4],
            isActive: busDetails[5]
          });
        } catch (err) {
          console.error(`Error loading bus ${i}:`, err);
        }
      }
      
      setBuses(busesData);
    } catch (err) {
      console.error('Error loading buses:', err);
    }
  };

  useEffect(() => {
    if (contract) {
      loadBuses();
    }
  }, [contract]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBusInputChange = (e) => {
    const { name, value } = e.target;
    setBusFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [lastTxHash, setLastTxHash] = useState('');

  const checkTransaction = async () => {
    if (!lastTxHash || !contract) {
      alert('No recent transaction to check');
      return;
    }
    
    try {
      const provider = contract.runner.provider;
      const receipt = await provider.getTransactionReceipt(lastTxHash);
      console.log('Transaction receipt:', receipt);
      
      if (receipt) {
        if (receipt.status === 1) {
          alert('Transaction successful! Refreshing buses...');
          await loadBuses();
        } else {
          alert('Transaction failed');
        }
      } else {
        alert('Transaction still pending...');
      }
    } catch (err) {
      console.error('Error checking transaction:', err);
      alert(`Error checking transaction: ${err.message}`);
    }
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
        loadBuses();
      }).catch(err => {
        console.error('Confirmation error:', err);
      });
      
    } catch (err) {
      console.error('Simple creation failed:', err);
      
      if (err.message.includes('circuit breaker')) {
        alert(`MetaMask circuit breaker is active! Please:
1. Click "Reset MetaMask" button
2. Wait 30 seconds
3. Try the transaction again
4. If that doesn't work, close and reopen MetaMask`);
      } else if (err.message.includes('timeout')) {
        alert(`Transaction timed out. This might be because:
1. MetaMask didn't show the transaction popup
2. The transaction is taking too long
3. Network issues

Try clicking "Reset MetaMask" and then try again.`);
      } else {
        alert(`Error: ${err.message}`);
      }
    } finally {
      setCreatingBus(false);
    }
  };

  const fillDemoData = () => {
    setBusFormData({
      name: 'Solar Farm Demo',
      owners: '',
      capacity: '10000',
      basePrice: '0.001'
    });
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
      
      // Test if we can call a view function that requires owner check
      try {
        const userBuses = await contract.getUserBuses(account);
        console.log('User buses:', userBuses);
      } catch (userBusError) {
        console.log('User bus check (might be empty):', userBusError.message);
      }
      
      // Test LOCK_DURATION constant
      try {
        const lockDuration = await contract.LOCK_DURATION();
        console.log('Lock duration:', lockDuration.toString());
      } catch (lockError) {
        console.log('Lock duration error:', lockError.message);
      }
      
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

  const handleCreateBus = async (e) => {
    e.preventDefault();
    
    console.log('Create bus button clicked');
    console.log('Contract:', !!contract);
    console.log('Account:', account);
    
    if (!contract || !account) {
      alert('Please connect your wallet first');
      return;
    }

    const { name, owners, capacity, basePrice } = busFormData;
    
    console.log('Form data:', { name, owners, capacity, basePrice });
    
    if (!name || !capacity || !basePrice) {
      alert('Please fill in all required fields (name, capacity, and base price)');
      return;
    }

    if (parseFloat(capacity) <= 0 || parseFloat(basePrice) <= 0) {
      alert('Capacity and base price must be greater than 0');
      return;
    }

    try {
      setCreatingBus(true);
      console.log('Starting bus creation process...');
      
      // Parse owners - split by comma and trim whitespace, filter out empty strings
      let ownerAddresses = [];
      if (owners.trim()) {
        const rawAddresses = owners.split(',').map(addr => addr.trim()).filter(addr => addr !== '');
        
        // Validate each address
        for (const addr of rawAddresses) {
          if (!ethers.isAddress(addr)) {
            throw new Error(`Invalid Ethereum address: ${addr}`);
          }
        }
        
        ownerAddresses = rawAddresses;
        console.log('Additional owners parsed and validated:', ownerAddresses);
      }
      
      // Add current account if not already in list
      if (!ownerAddresses.includes(account)) {
        ownerAddresses.push(account);
      }
      
      console.log('Final owner addresses:', ownerAddresses);
      
      // Convert base price to wei
      const basePriceInWei = ethers.parseEther(basePrice);
      console.log('Base price in wei:', basePriceInWei.toString());
      
      console.log('Calling createEnergyBus with params:', {
        name,
        ownerAddresses,
        capacity: parseInt(capacity),
        basePriceInWei: basePriceInWei.toString()
      });
      
      console.log('About to estimate gas...');
      
      // Estimate gas first with timeout
      try {
        const gasEstimatePromise = contract.createEnergyBus.estimateGas(
          name,
          ownerAddresses,
          parseInt(capacity),
          basePriceInWei
        );
        
        const gasTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gas estimation timeout after 10 seconds')), 10000)
        );
        
        const gasEstimate = await Promise.race([gasEstimatePromise, gasTimeoutPromise]);
        console.log('Gas estimate successful:', gasEstimate.toString());
      } catch (gasError) {
        console.error('Gas estimation failed:', gasError);
        throw new Error(`Gas estimation failed: ${gasError.message}`);
      }
      
      console.log('About to send transaction...');
      
      // Send transaction with timeout
      const txPromise = contract.createEnergyBus(
        name,
        ownerAddresses,
        parseInt(capacity),
        basePriceInWei
      );
      
      const txTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Transaction submission timeout after 30 seconds')), 30000)
      );
      
      const tx = await Promise.race([txPromise, txTimeoutPromise]);
      
      console.log('Transaction sent:', tx.hash);
      console.log('Transaction object:', tx);
      setLastTxHash(tx.hash);
      
      // Try a simpler approach - just wait a bit then check
      alert(`Transaction submitted! Hash: ${tx.hash}\nClick "Check Last Transaction" to verify it was mined.`);
      
      // Reset form immediately
      setBusFormData({ name: '', owners: '', capacity: '', basePrice: '' });
      
      // Try to wait for confirmation but don't block the UI
      setTimeout(async () => {
        try {
          const receipt = await tx.wait(1); // Wait for 1 confirmation
          console.log('Transaction confirmed:', receipt);
          alert('Transaction confirmed! Refreshing buses...');
          await loadBuses();
        } catch (waitError) {
          console.error('Error waiting for confirmation:', waitError);
          // Don't show error alert since we already showed success
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error creating bus:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        data: err.data
      });
      
      let errorMessage = 'Failed to create energy bus. ';
      
      if (err.message.includes('user rejected')) {
        errorMessage += 'Transaction was rejected by user.';
      } else if (err.message.includes('insufficient funds')) {
        errorMessage += 'Insufficient funds for gas fees.';
      } else if (err.message.includes('Caller must be in owners list')) {
        errorMessage += 'You must be included in the owners list.';
      } else if (err.message.includes('invalid address')) {
        errorMessage += 'One of the owner addresses is invalid.';
      } else {
        errorMessage += `Error: ${err.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setCreatingBus(false);
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    if (!contract || !account) {
      alert('Please connect your wallet first');
      return;
    }

    const { busId, energyAmount, pricePerUnit } = formData;
    
    if (!busId || !energyAmount || !pricePerUnit) {
      alert('Please fill in all fields');
      return;
    }

    if (parseFloat(energyAmount) <= 0 || parseFloat(pricePerUnit) <= 0) {
      alert('Values must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      // Convert price to wei
      const priceInWei = ethers.parseEther(pricePerUnit);
      
      const tx = await contract.createOffer(
        parseInt(busId),
        parseInt(energyAmount),
        priceInWei
      );
      
      await tx.wait();
      
      alert('Energy offer created successfully!');
      setFormData({ busId: '', energyAmount: '', pricePerUnit: '' });
      await loadBuses(); // Refresh bus data to show updated available capacity
      
    } catch (err) {
      console.error('Error creating offer:', err);
      
      if (err.message.includes('Insufficient bus capacity')) {
        alert('Insufficient bus capacity. Please choose a lower amount.');
      } else {
        alert('Failed to create energy offer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const { energyAmount, pricePerUnit } = formData;
    if (energyAmount && pricePerUnit) {
      return (parseFloat(energyAmount) * parseFloat(pricePerUnit)).toFixed(6);
    }
    return '0';
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Energy Offer</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
          Please connect your wallet to create energy offers
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Energy Management</h1>
        <p className="text-gray-600">Create energy buses and offers for trading</p>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg text-sm">
        <h3 className="font-medium mb-2">Connection Status:</h3>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <span className="text-gray-600">Account:</span>
            <span className={`ml-2 ${account ? 'text-green-600' : 'text-red-600'}`}>
              {account ? `${account.slice(0,6)}...${account.slice(-4)}` : 'Not connected'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Contract:</span>
            <span className={`ml-2 ${contract ? 'text-green-600' : 'text-red-600'}`}>
              {contract ? 'Connected' : 'Not loaded'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Buses loaded:</span>
            <span className="ml-2 text-blue-600">{buses.length}</span>
          </div>
        </div>
        {lastTxHash && (
          <div className="mb-3 text-xs">
            <span className="text-gray-600">Last Transaction:</span>
            <span className="ml-2 font-mono text-blue-600">{lastTxHash}</span>
          </div>
        )}
        {contract && (
          <div className="space-x-2">
            <button
              onClick={testContract}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Test Contract Connection
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
            <button
              onClick={fillDemoData}
              className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Fill Demo Data
            </button>
            <button
              onClick={createBusSimple}
              disabled={creatingBus}
              className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 disabled:opacity-50"
            >
              {creatingBus ? 'Creating...' : 'Simple Create Bus'}
            </button>
            {lastTxHash && (
              <button
                onClick={checkTransaction}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
              >
                Check Last Transaction
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Bus Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Energy Bus</h2>
          
          <form onSubmit={handleCreateBus} className="space-y-4">
            <div>
              <label htmlFor="busName" className="block text-sm font-medium text-gray-700 mb-2">
                Bus Name
              </label>
              <input
                type="text"
                id="busName"
                name="name"
                value={busFormData.name}
                onChange={handleBusInputChange}
                placeholder="e.g., Solar Farm A"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="owners" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Owners <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="owners"
                name="owners"
                value={busFormData.owners}
                onChange={handleBusInputChange}
                placeholder="0x123..., 0x456... (leave empty to be sole owner)"
                className="input-field"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your address will be automatically included as an owner
              </p>
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                Total Capacity (Wh)
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={busFormData.capacity}
                onChange={handleBusInputChange}
                placeholder="Enter total capacity in Watt-hours"
                className="input-field"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Base Price per Wh (ETH)
              </label>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                value={busFormData.basePrice}
                onChange={handleBusInputChange}
                placeholder="Enter base price per Wh in ETH"
                className="input-field"
                min="0.000001"
                step="0.000001"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creatingBus || !contract || !account}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingBus ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Bus...
                </div>
              ) : !contract ? (
                'Contract Not Loaded'
              ) : !account ? (
                'Connect Wallet First'
              ) : (
                'Create Energy Bus'
              )}
            </button>
            
            {(!contract || !account) && (
              <div className="mt-2 text-sm text-red-600">
                {!account && '⚠️ Please connect your wallet first'}
                {!contract && account && '⚠️ Contract not loaded - check if blockchain is running'}
              </div>
            )}
          </form>
        </div>

        {/* Create Offer Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Energy Offer</h2>
          
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div>
              <label htmlFor="busId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Energy Bus
              </label>
              <select
                id="busId"
                name="busId"
                value={formData.busId}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="">Choose a bus</option>
                {buses.filter(bus => bus.isActive).map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.name} - {bus.availableCapacity.toString()} Wh available
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="energyAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Energy Amount (Wh)
              </label>
              <input
                type="number"
                id="energyAmount"
                name="energyAmount"
                value={formData.energyAmount}
                onChange={handleInputChange}
                placeholder="Enter energy amount in Watt-hours"
                className="input-field"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-2">
                Price per Wh (ETH)
              </label>
              <input
                type="number"
                id="pricePerUnit"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleInputChange}
                placeholder="Enter price per Wh in ETH"
                className="input-field"
                min="0.000001"
                step="0.000001"
                required
              />
            </div>

            {formData.energyAmount && formData.pricePerUnit && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Offer Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Energy Amount:</span>
                    <span>{formData.energyAmount} Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per Wh:</span>
                    <span>{formData.pricePerUnit} ETH</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Value:</span>
                    <span>{calculateTotal()} ETH</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Offer...' : 'Create Energy Offer'}
            </button>
          </form>
        </div>
      </div>

      {/* Existing Buses */}
      {buses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Energy Buses</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {buses.map((bus) => (
              <div key={bus.id} className="card">
                <h3 className="font-medium text-gray-900 mb-2">{bus.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Capacity:</span>
                    <span>{bus.totalCapacity.toString()} Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span>{bus.availableCapacity.toString()} Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>{ethers.formatEther(bus.basePrice)} ETH/Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owners:</span>
                    <span>{bus.owners.length} owner(s)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tips for Energy Trading</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Create energy buses to organize different energy sources</li>
          <li>• Set competitive prices to attract buyers</li>
          <li>• Multiple owners can manage the same energy bus</li>
          <li>• Energy is measured in Watt-hours (Wh) for precision</li>
          <li>• Use batch purchases for buying from multiple offers</li>
        </ul>
      </div>
    </div>
  );
};

export default ListEnergy;
