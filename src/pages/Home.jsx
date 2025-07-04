import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import EnergyCard from '../components/EnergyCard';

const Home = () => {
  const { contract, account } = useWeb3();
  const [offers, setOffers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userNonce, setUserNonce] = useState(0);

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
      if (busesData.length > 0 && !selectedBus) {
        setSelectedBus(busesData[0].id);
      }
    } catch (err) {
      console.error('Error loading buses:', err);
      setError('Failed to load energy buses');
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
    if (selectedBus) {
      loadOffers();
    }
  }, [selectedBus]);

  const refreshData = () => {
    loadOffers();
    loadUserNonce();
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

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-energy-blue"></div>
          <p className="mt-2 text-gray-600">Loading energy offers...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && offers.length === 0 && !error && selectedBus && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Energy Offers Available</h3>
          <p className="text-gray-600 mb-6">Be the first to create an offer on this energy bus!</p>
          <a href="/list-energy" className="btn-primary">
            Create Energy Offer
          </a>
        </div>
      )}

      {!loading && offers.length > 0 && (
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
  );
};

export default Home;
