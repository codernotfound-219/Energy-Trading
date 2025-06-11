import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const MyPurchases = () => {
  const { contract, account } = useWeb3();
  const [purchases, setPurchases] = useState([]);
  const [energyBalance, setEnergyBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMyPurchases = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get user purchase indices
      const userPurchaseIndices = await contract.getUserPurchases(account);
      
      // Get purchase details
      const purchasePromises = userPurchaseIndices.map(index => contract.getPurchase(index));
      const userPurchases = await Promise.all(purchasePromises);
      
      setPurchases(userPurchases);
      
      // Get user's energy balance
      const balance = await contract.getUserEnergyBalance(account);
      setEnergyBalance(balance.toString());
      
    } catch (err) {
      console.error('Error loading purchases:', err);
      setError('Failed to load your purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyPurchases();
  }, [contract, account]);

  const formatPrice = (priceInWei) => {
    return ethers.formatEther(priceInWei);
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const calculateTotalSpent = () => {
    return purchases.reduce((total, purchase) => {
      return total + parseFloat(formatPrice(purchase.totalPrice));
    }, 0).toFixed(4);
  };

  const calculateTotalEnergy = () => {
    return purchases.reduce((total, purchase) => {
      return total + parseInt(purchase.energyAmount.toString());
    }, 0);
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Purchases</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
          Please connect your wallet to view your purchases
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Energy Purchases</h1>
        <p className="text-gray-600">Track your energy purchases and current balance</p>
      </div>

      {/* Energy Balance Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-energy-blue text-white">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Current Energy Balance</h3>
            <p className="text-3xl font-bold">{energyBalance} kWh</p>
          </div>
        </div>
        
        <div className="card bg-energy-green text-white">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Total Energy Purchased</h3>
            <p className="text-3xl font-bold">{calculateTotalEnergy()} kWh</p>
          </div>
        </div>
        
        <div className="card bg-purple-500 text-white">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Total Spent</h3>
            <p className="text-3xl font-bold">{calculateTotalSpent()} ETH</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-energy-blue"></div>
          <p className="mt-2 text-gray-600">Loading your purchases...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && purchases.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Purchases Yet</h3>
          <p className="text-gray-600 mb-6">You haven't purchased any energy yet.</p>
          <a href="/" className="btn-primary">
            Browse Energy Marketplace
          </a>
        </div>
      )}

      {!loading && purchases.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Purchase History</h2>
          
          {purchases.map((purchase, index) => (
            <div key={index} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {purchase.energyAmount.toString()} kWh
                  </h3>
                  <p className="text-sm text-gray-600">
                    Purchased on {formatDate(purchase.timestamp)}
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  Completed
                </span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-gray-600 block text-sm">Energy Amount</span>
                  <span className="font-medium">{purchase.energyAmount.toString()} kWh</span>
                </div>
                
                <div>
                  <span className="text-gray-600 block text-sm">Total Price</span>
                  <span className="font-bold">{formatPrice(purchase.totalPrice)} ETH</span>
                </div>
                
                <div>
                  <span className="text-gray-600 block text-sm">Seller</span>
                  <span className="font-mono text-sm">
                    {purchase.seller.slice(0, 6)}...{purchase.seller.slice(-4)}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-600 block text-sm">Listing ID</span>
                  <span className="font-mono text-sm">#{purchase.listingId.toString()}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-800">
                  ✅ Energy successfully transferred to your balance
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPurchases;
