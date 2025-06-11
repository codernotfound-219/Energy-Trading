import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import EnergyCard from '../components/EnergyCard';

const Home = () => {
  const { contract, account } = useWeb3();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadListings = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError(null);
      
      const activeListings = await contract.getActiveListings();
      setListings(activeListings);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('Failed to load energy listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [contract]);

  if (!account) {
    return (
      <div className="text-center py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to P2P Energy Trading
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Buy and sell renewable energy directly with your peers using blockchain technology
          </p>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
            Please connect your wallet to access the marketplace
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="text-center">
            <div className="bg-energy-blue text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-semibold mb-2">Renewable Energy</h3>
            <p className="text-gray-600">Trade solar, wind, and other renewable energy sources</p>
          </div>
          
          <div className="text-center">
            <div className="bg-energy-green text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              🔗
            </div>
            <h3 className="text-lg font-semibold mb-2">Blockchain Powered</h3>
            <p className="text-gray-600">Secure, transparent transactions using smart contracts</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              👥
            </div>
            <h3 className="text-lg font-semibold mb-2">Peer-to-Peer</h3>
            <p className="text-gray-600">Direct trading without intermediaries</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Energy Marketplace</h1>
        <p className="text-gray-600">Discover and purchase renewable energy from your community</p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-energy-blue"></div>
          <p className="mt-2 text-gray-600">Loading energy listings...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && listings.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Energy Listings Available</h3>
          <p className="text-gray-600 mb-6">Be the first to list your renewable energy for sale!</p>
          <a href="/list-energy" className="btn-primary">
            List Your Energy
          </a>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <EnergyCard
              key={listing.id.toString()}
              listing={listing}
              onPurchaseSuccess={loadListings}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
