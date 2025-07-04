import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const MyPurchases = () => {
  const { contract, account } = useWeb3();
  const [purchases, setPurchases] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMyPurchases = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get all buses to have bus information
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
      
      // Get all user's purchases across all buses
      const allPurchases = [];
      
      for (let i = 1; i <= busCount; i++) {
        try {
          const userPurchaseIds = await contract.getUserBusPurchases(i, account);
          
          for (let j = 0; j < userPurchaseIds.length; j++) {
            const purchaseId = userPurchaseIds[j];
            const purchaseDetails = await contract.getPurchaseDetails(purchaseId);
            
            // Find the bus name
            const bus = busesData.find(b => b.id === i);
            
            allPurchases.push({
              id: purchaseId,
              busId: purchaseDetails[0],
              busName: bus ? bus.name : `Bus ${i}`,
              offerId: purchaseDetails[1],
              buyer: purchaseDetails[2],
              seller: purchaseDetails[3],
              energyAmount: purchaseDetails[4],
              totalPrice: purchaseDetails[5],
              timestamp: purchaseDetails[6],
              completed: purchaseDetails[7]
            });
          }
        } catch (err) {
          console.error(`Error loading purchases for bus ${i}:`, err);
        }
      }
      
      setPurchases(allPurchases);
      
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

      {/* Energy Purchase Summary */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-energy-green text-white">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Total Energy Purchased</h3>
            <p className="text-3xl font-bold">{calculateTotalEnergy()} Wh</p>
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
                    {purchase.energyAmount.toString()} Wh
                  </h3>
                  <p className="text-sm text-gray-600">
                    From: {purchase.busName}
                  </p>
                  <p className="text-sm text-gray-500">
                    Purchased on {formatDate(purchase.timestamp)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  purchase.completed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {purchase.completed ? 'Completed' : 'Pending'}
                </span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-gray-600 block text-sm">Energy Amount</span>
                  <span className="font-medium">{purchase.energyAmount.toString()} Wh</span>
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
                  <span className="text-gray-600 block text-sm">Purchase ID</span>
                  <span className="font-mono text-sm">#{purchase.id.toString()}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Bus ID:</span>
                    <span className="ml-2 font-mono">#{purchase.busId.toString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Offer ID:</span>
                    <span className="ml-2 font-mono">#{purchase.offerId.toString()}</span>
                  </div>
                </div>
              </div>

              {purchase.completed && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-800">
                    ✅ Energy transfer completed successfully
                  </p>
                </div>
              )}
            </div>
          ))}
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-2">💡 About Your Energy Purchases</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Energy is measured in Watt-hours (Wh) for precision</li>
              <li>• Each purchase is tied to a specific energy bus</li>
              <li>• Purchases may be pending until transfer is confirmed</li>
              <li>• You can purchase partial amounts from offers</li>
              <li>• Use batch purchases to buy from multiple offers at once</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPurchases;
