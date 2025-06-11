import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const MyListings = () => {
  const { contract, account } = useWeb3();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMyListings = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      setError(null);
      
      const userListingIds = await contract.getUserListings(account);
      const listingPromises = userListingIds.map(id => contract.listings(id));
      const userListings = await Promise.all(listingPromises);
      
      setListings(userListings);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const cancelListing = async (listingId) => {
    if (!contract) return;

    try {
      const tx = await contract.cancelListing(listingId);
      await tx.wait();
      
      alert('Listing cancelled successfully!');
      loadMyListings(); // Reload listings
    } catch (err) {
      console.error('Error cancelling listing:', err);
      alert('Failed to cancel listing. Please try again.');
    }
  };

  useEffect(() => {
    loadMyListings();
  }, [contract, account]);

  const formatPrice = (priceInWei) => {
    return ethers.formatEther(priceInWei);
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getStatusBadge = (listing) => {
    if (listing.isSold) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Sold</span>;
    } else if (listing.isActive) {
      return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Active</span>;
    } else {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">Cancelled</span>;
    }
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Listings</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
          Please connect your wallet to view your listings
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Energy Listings</h1>
        <p className="text-gray-600">Manage your energy listings and track sales</p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-energy-blue"></div>
          <p className="mt-2 text-gray-600">Loading your listings...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && listings.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Listings Yet</h3>
          <p className="text-gray-600 mb-6">You haven't listed any energy for sale yet.</p>
          <a href="/list-energy" className="btn-primary">
            Create Your First Listing
          </a>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <div className="space-y-6">
          {listings.map((listing) => (
            <div key={listing.id.toString()} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {listing.energyAmount.toString()} kWh
                  </h3>
                  <p className="text-sm text-gray-600">
                    Listed on {formatDate(listing.timestamp)}
                  </p>
                </div>
                {getStatusBadge(listing)}
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <span className="text-gray-600 block text-sm">Price per kWh</span>
                  <span className="font-medium">{formatPrice(listing.pricePerKWh)} ETH</span>
                </div>
                
                <div>
                  <span className="text-gray-600 block text-sm">Total Price</span>
                  <span className="font-bold">{formatPrice(listing.totalPrice)} ETH</span>
                </div>
                
                <div>
                  <span className="text-gray-600 block text-sm">Listing ID</span>
                  <span className="font-mono text-sm">#{listing.id.toString()}</span>
                </div>
              </div>

              {listing.isActive && !listing.isSold && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => cancelListing(listing.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Cancel Listing
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
