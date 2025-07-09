import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import EnergyCard from '../components/EnergyCard';
import { ethers } from 'ethers';

const Home = () => {
  const { contract, account } = useWeb3();
  const [offers, setOffers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userNonce, setUserNonce] = useState(0);
  const [viewMode, setViewMode] = useState('buses'); // 'buses' or 'offers'

  const loadBuses = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const busCount = await contract.getBusCount();
      const busesData = [];
      
      for (let i = 1; i <= busCount; i++) {
        try {
          const busDetails = await contract.getBusDetails(i);
          
          // Get offer count for this bus
          const activeOfferIds = await contract.getBusActiveOffers(i);
          
          busesData.push({
            id: i,
            name: busDetails[0],
            owners: busDetails[1],
            totalCapacity: busDetails[2],
            availableCapacity: busDetails[3],
            basePrice: busDetails[4],
            isActive: busDetails[5],
            offerCount: activeOfferIds.length
          });
        } catch (err) {
          console.error(`Error loading bus ${i}:`, err);
        }
      }
      
      setBuses(busesData);
      if (busesData.length > 0 && !selectedBus) {
        setSelectedBus(busesData[0].id);
      }
    } catch (err) {
      console.error('Error loading buses:', err);
      setError('Failed to load energy buses');
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!contract || !selectedBus) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading offers for bus:', selectedBus);
      const activeOfferIds = await contract.getBusActiveOffers(selectedBus);
      console.log('Active offer IDs:', activeOfferIds);
      
      const offersData = [];
      for (let i = 0; i < activeOfferIds.length; i++) {
        try {
          const offerId = activeOfferIds[i];
          const offerDetails = await contract.getOfferDetails(offerId);
          offersData.push({
            id: offerId,
            busId: offerDetails[0],
            seller: offerDetails[1],
            energyAmount: offerDetails[2],
            pricePerUnit: offerDetails[3],
            isActive: offerDetails[4],
            lockExpiry: offerDetails[5]
          });
        } catch (err) {
          console.error(`Error loading offer ${activeOfferIds[i]}:`, err);
        }
      }
      
      console.log('Formatted offers:', offersData);
      setOffers(offersData || []);
    } catch (err) {
      console.error('Error loading offers:', err);
      setError('Failed to load energy offers');
    } finally {
      setLoading(false);
    }
  };

  const loadUserNonce = async () => {
    if (!contract || !account) return;
    
    try {
      const nonce = await contract.userNonce(account);
      setUserNonce(Number(nonce));
    } catch (err) {
      console.error('Error loading user nonce:', err);
    }
  };

  useEffect(() => {
    if (contract) {
      loadBuses();
      loadUserNonce();
    }
  }, [contract, account]);

  useEffect(() => {
    if (selectedBus && viewMode === 'offers') {
      loadOffers();
    }
  }, [selectedBus, viewMode]);

  const refreshData = () => {
    loadBuses();
    loadOffers();
    loadUserNonce();
  };

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

  if (!account) {
    return (
      <div className="text-center py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to MultiBus Energy Trading
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Trade renewable energy across multiple energy buses using blockchain technology
          </p>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
            Please connect your wallet to access the marketplace
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="text-center">
            <div className="bg-energy-blue text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              🚌
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Bus System</h3>
            <p className="text-gray-600">Trade across different energy grids and sources</p>
          </div>
          
          <div className="text-center">
            <div className="bg-energy-green text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              🔗
            </div>
            <h3 className="text-lg font-semibold mb-2">Concurrent Trading</h3>
            <p className="text-gray-600">Handle multiple simultaneous transactions safely</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              👥
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-Owner Buses</h3>
            <p className="text-gray-600">Collaborative energy grid management</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Energy Marketplace</h1>
        <p className="text-gray-600">Discover and purchase renewable energy from multiple energy buses</p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('buses')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'buses'
                ? 'bg-energy-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Browse Energy Buses
          </button>
          <button
            onClick={() => setViewMode('offers')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              viewMode === 'offers'
                ? 'bg-energy-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Browse Energy Offers
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-energy-blue"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Buses View */}
      {viewMode === 'buses' && !loading && (
        <div>
          {buses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🚌</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Energy Buses Available</h3>
              <p className="text-gray-600 mb-6">Be the first to create an energy bus!</p>
              <a href="/create-bus" className="btn-primary">
                Create Energy Bus
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buses.map((bus) => (
                <div key={bus.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{bus.name}</h3>
                      <p className="text-sm text-gray-600">Bus #{bus.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bus.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {bus.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Capacity:</span>
                      <span className="font-medium">{bus.totalCapacity.toString()} Wh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-medium">{bus.availableCapacity.toString()} Wh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Price:</span>
                      <span className="font-medium">{formatPrice(bus.basePrice)} ETH/Wh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Offers:</span>
                      <span className="font-medium">{bus.offerCount}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedBus(bus.id);
                        setViewMode('offers');
                      }}
                      className="w-full btn-primary"
                    >
                      View Offers
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offers View */}
      {viewMode === 'offers' && !loading && (
        <div>
          {/* Bus Selector */}
          {buses.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Energy Bus
              </label>
              <select
                value={selectedBus || ''}
                onChange={(e) => setSelectedBus(parseInt(e.target.value))}
                className="input-field max-w-md"
              >
                <option value="">Select a bus</option>
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.name} - {bus.availableCapacity.toString()} Wh available
                  </option>
                ))}
              </select>
              
              {selectedBus && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {buses.find(b => b.id === selectedBus)?.name} Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Capacity:</span>
                      <span className="ml-2 font-medium">
                        {buses.find(b => b.id === selectedBus)?.totalCapacity.toString()} Wh
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Available:</span>
                      <span className="ml-2 font-medium">
                        {buses.find(b => b.id === selectedBus)?.availableCapacity.toString()} Wh
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!selectedBus ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🚌</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Select an Energy Bus</h3>
              <p className="text-gray-600">Choose a bus to view its available energy offers</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Energy Offers Available</h3>
              <p className="text-gray-600 mb-6">Be the first to create an offer on this energy bus!</p>
              <a href="/list-energy" className="btn-primary">
                Create Energy Offer
              </a>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <EnergyCard
                  key={offer.id.toString()}
                  offer={offer}
                  userNonce={userNonce}
                  onPurchaseSuccess={refreshData}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
