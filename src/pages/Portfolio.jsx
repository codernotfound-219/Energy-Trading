import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const Portfolio = () => {
  const { contract, account } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [listings, setListings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPortfolioData = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get all buses first
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
      
      // Load user's listings
      const allListings = [];
      const allPurchases = [];
      
      for (let i = 1; i <= busCount; i++) {
        try {
          // Get user's offers
          const userOfferIds = await contract.getUserBusOffers(i, account);
          
          for (let j = 0; j < userOfferIds.length; j++) {
            const offerId = userOfferIds[j];
            try {
              const offerDetails = await contract.getOfferDetails(offerId);
              const bus = busesData.find(b => b.id === i);
              
              let totalPrice = 0;
              try {
                const energyAmount = offerDetails[2];
                const pricePerUnit = offerDetails[3];
                
                if (energyAmount && pricePerUnit) {
                  const energyBN = ethers.toBigInt(energyAmount.toString());
                  const priceBN = ethers.toBigInt(pricePerUnit.toString());
                  totalPrice = energyBN * priceBN;
                }
              } catch (error) {
                console.error("Error calculating total price:", error);
                totalPrice = 0;
              }
              
              allListings.push({
                id: offerId,
                busId: offerDetails[0],
                busName: bus ? bus.name : `Bus ${i}`,
                seller: offerDetails[1],
                energyAmount: offerDetails[2],
                pricePerUnit: offerDetails[3],
                isActive: offerDetails[4],
                lockExpiry: offerDetails[5],
                totalPrice: totalPrice,
                timestamp: Date.now() // Estimate for now
              });
            } catch (offerError) {
              console.error(`Error loading offer ${offerId}:`, offerError);
            }
          }
          
          // Get user's purchases
          const userPurchaseIds = await contract.getUserBusPurchases(i, account);
          
          for (let j = 0; j < userPurchaseIds.length; j++) {
            const purchaseId = userPurchaseIds[j];
            const purchaseDetails = await contract.getPurchaseDetails(purchaseId);
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
          console.error(`Error loading data for bus ${i}:`, err);
        }
      }
      
      setListings(allListings);
      setPurchases(allPurchases);
      
    } catch (err) {
      console.error('Error loading portfolio data:', err);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, [contract, account]);

  const formatPrice = (priceInWei) => {
    try {
      if (!priceInWei || priceInWei === "" || priceInWei === "0") {
        return "0";
      }
      return ethers.formatEther(priceInWei.toString());
    } catch (error) {
      console.error("Error formatting price:", error);
      return "0";
    }
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  // Analytics calculations
  const calculateAnalytics = () => {
    const totalEnergyListed = listings.reduce((total, listing) => {
      return total + parseInt(listing.energyAmount.toString());
    }, 0);

    const totalListingValue = listings.reduce((total, listing) => {
      return total + parseFloat(formatPrice(listing.totalPrice));
    }, 0);

    const totalEnergyPurchased = purchases.reduce((total, purchase) => {
      return total + parseInt(purchase.energyAmount.toString());
    }, 0);

    const totalSpent = purchases.reduce((total, purchase) => {
      return total + parseFloat(formatPrice(purchase.totalPrice));
    }, 0);

    const activeListing = listings.filter(l => l.isActive).length;
    const completedPurchases = purchases.filter(p => p.completed).length;

    // Calculate net position (what we've earned vs spent)
    const netPosition = totalListingValue - totalSpent;

    return {
      totalEnergyListed,
      totalListingValue,
      totalEnergyPurchased,
      totalSpent,
      activeListing,
      completedPurchases,
      netPosition
    };
  };

  const analytics = calculateAnalytics();

  const getStatusBadge = (listing) => {
    if (listing.lockExpiry > Date.now() / 1000) {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Locked</span>;
    } else if (listing.isActive) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Active</span>;
    } else {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">Inactive</span>;
    }
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Portfolio</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
          Please connect your wallet to view your portfolio
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Energy Portfolio</h1>
        <p className="text-gray-600">Track your energy trading performance and manage your assets</p>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-blue-500 text-white">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-1">Active Listings</h3>
            <p className="text-2xl font-bold">{analytics.activeListing}</p>
            <p className="text-sm opacity-80">{analytics.totalEnergyListed} Wh total</p>
          </div>
        </div>
        
        <div className="card bg-green-500 text-white">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-1">Listing Value</h3>
            <p className="text-2xl font-bold">{analytics.totalListingValue.toFixed(4)} ETH</p>
            <p className="text-sm opacity-80">Potential earnings</p>
          </div>
        </div>
        
        <div className="card bg-purple-500 text-white">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-1">Total Purchases</h3>
            <p className="text-2xl font-bold">{analytics.completedPurchases}</p>
            <p className="text-sm opacity-80">{analytics.totalEnergyPurchased} Wh bought</p>
          </div>
        </div>
        
        <div className={`card text-white ${analytics.netPosition >= 0 ? 'bg-green-600' : 'bg-red-500'}`}>
          <div className="text-center">
            <h3 className="text-sm font-medium mb-1">Net Position</h3>
            <p className="text-2xl font-bold">
              {analytics.netPosition >= 0 ? '+' : ''}{analytics.netPosition.toFixed(4)} ETH
            </p>
            <p className="text-sm opacity-80">
              {analytics.netPosition >= 0 ? 'Profit' : 'Loss'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-energy-blue text-energy-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'listings'
                ? 'border-energy-blue text-energy-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'purchases'
                ? 'border-energy-blue text-energy-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Purchases ({purchases.length})
          </button>
        </nav>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-energy-blue"></div>
          <p className="mt-2 text-gray-600">Loading portfolio data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Energy Listed:</span>
                      <span className="font-medium">{analytics.totalEnergyListed} Wh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Energy Purchased:</span>
                      <span className="font-medium">{analytics.totalEnergyPurchased} Wh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Listings:</span>
                      <span className="font-medium">{analytics.activeListing}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Purchases:</span>
                      <span className="font-medium">{analytics.completedPurchases}</span>
                    </div>
                    <hr className="my-3" />
                    <div className="flex justify-between">
                      <span className="text-gray-600">Potential Earnings:</span>
                      <span className="font-bold text-green-600">{analytics.totalListingValue.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-bold text-red-600">{analytics.totalSpent.toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Net Position:</span>
                      <span className={`font-bold ${analytics.netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analytics.netPosition >= 0 ? '+' : ''}{analytics.netPosition.toFixed(4)} ETH
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {listings.slice(0, 3).map((listing, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">Listed {listing.energyAmount.toString()} Wh</p>
                          <p className="text-xs text-gray-500">{listing.busName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatPrice(listing.totalPrice)} ETH</p>
                          {getStatusBadge(listing)}
                        </div>
                      </div>
                    ))}
                    {purchases.slice(0, 3).map((purchase, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded">
                        <div>
                          <p className="text-sm font-medium">Bought {purchase.energyAmount.toString()} Wh</p>
                          <p className="text-xs text-gray-500">{purchase.busName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatPrice(purchase.totalPrice)} ETH</p>
                          <span className={`px-2 py-1 rounded text-xs ${
                            purchase.completed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {purchase.completed ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-energy-blue to-energy-green p-6 rounded-lg text-white">
                <h3 className="text-lg font-semibold mb-2">💡 Portfolio Insights</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="mb-1">• You have {analytics.activeListing} active energy listings</p>
                    <p className="mb-1">• Total energy trading volume: {analytics.totalEnergyListed + analytics.totalEnergyPurchased} Wh</p>
                    <p>• Average listing size: {analytics.totalEnergyListed > 0 ? Math.round(analytics.totalEnergyListed / listings.length) : 0} Wh</p>
                  </div>
                  <div>
                    <p className="mb-1">• Net trading position: {analytics.netPosition >= 0 ? 'Profitable' : 'Loss'}</p>
                    <p className="mb-1">• Portfolio efficiency: {analytics.completedPurchases > 0 ? Math.round((analytics.activeListing / analytics.completedPurchases) * 100) : 0}%</p>
                    <p>• Trading activity: {(listings.length + purchases.length) > 5 ? 'High' : 'Moderate'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="space-y-6">
              {listings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Listings Yet</h3>
                  <p className="text-gray-600 mb-6">You haven't listed any energy for sale yet.</p>
                  <a href="/list-energy" className="btn-primary">
                    Create Your First Listing
                  </a>
                </div>
              ) : (
                listings.map((listing) => (
                  <div key={listing.id.toString()} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {listing.energyAmount.toString()} Wh
                        </h3>
                        <p className="text-sm text-gray-600">
                          Energy Bus: {listing.busName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Offer ID: #{listing.id.toString()}
                        </p>
                      </div>
                      {getStatusBadge(listing)}
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <span className="text-gray-600 block text-sm">Price per Wh</span>
                        <span className="font-medium">{formatPrice(listing.pricePerUnit)} ETH</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-600 block text-sm">Total Value</span>
                        <span className="font-bold">{formatPrice(listing.totalPrice)} ETH</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-600 block text-sm">Energy Amount</span>
                        <span className="font-medium">{listing.energyAmount.toString()} Wh</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Bus ID:</span>
                          <span className="ml-2 font-mono">#{listing.busId.toString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2">{listing.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>

                    {listing.lockExpiry > Date.now() / 1000 && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                          🔒 This offer is temporarily locked due to an active transaction.
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-6">
              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Purchases Yet</h3>
                  <p className="text-gray-600 mb-6">You haven't purchased any energy yet.</p>
                  <a href="/" className="btn-primary">
                    Browse Energy Marketplace
                  </a>
                </div>
              ) : (
                purchases.map((purchase, index) => (
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
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Portfolio;
