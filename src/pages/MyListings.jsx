import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const MyListings = () => {
  const { contract, account } = useWeb3();
  const [listings, setListings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMyListings = async () => {
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
      
      // Get all user's offers across all buses
      const allOffers = [];
      
      for (let i = 1; i <= busCount; i++) {
        try {
          const userOfferIds = await contract.getUserBusOffers(i, account);
          
          for (let j = 0; j < userOfferIds.length; j++) {
            const offerId = userOfferIds[j];
            try {
              const offerDetails = await contract.getOfferDetails(offerId);
              console.log(`Offer ${offerId} details:`, {
                busId: offerDetails[0]?.toString(),
                seller: offerDetails[1],
                energyAmount: offerDetails[2]?.toString(),
                pricePerUnit: offerDetails[3]?.toString(),
                isActive: offerDetails[4],
                lockExpiry: offerDetails[5]?.toString()
              });
              
              // Find the bus name
              const bus = busesData.find(b => b.id === i);
              
              // Safely calculate total price
              let totalPrice = 0;
              try {
                const energyAmount = offerDetails[2];
                const pricePerUnit = offerDetails[3];
                
                // Convert to BigNumber if needed and multiply
                if (energyAmount && pricePerUnit) {
                  const energyBN = ethers.toBigInt(energyAmount.toString());
                  const priceBN = ethers.toBigInt(pricePerUnit.toString());
                  totalPrice = energyBN * priceBN;
                }
              } catch (error) {
                console.error("Error calculating total price:", error);
                totalPrice = 0;
              }
              
              allOffers.push({
                id: offerId,
                busId: offerDetails[0],
                busName: bus ? bus.name : `Bus ${i}`,
                seller: offerDetails[1],
                energyAmount: offerDetails[2],
                pricePerUnit: offerDetails[3],
                isActive: offerDetails[4],
                lockExpiry: offerDetails[5],
                totalPrice: totalPrice
              });
            } catch (offerError) {
              console.error(`Error loading offer ${offerId}:`, offerError);
            }
          }
        } catch (err) {
          console.error(`Error loading offers for bus ${i}:`, err);
        }
      }
      
      setListings(allOffers);
    } catch (err) {
      console.error('Error loading listings:', err);
      setError('Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  const cancelListing = async (listingId) => {
    // Note: The MultiBus contract doesn't have a cancel function
    // Offers are automatically managed by the contract
    alert('Manual cancellation is not available in the MultiBus contract. Offers are automatically managed based on capacity and purchases.');
  };

  useEffect(() => {
    loadMyListings();
  }, [contract, account]);

  const formatPrice = (priceInWei) => {
    try {
      // Handle null, undefined, empty string, or 0
      if (!priceInWei || priceInWei === "" || priceInWei === "0") {
        return "0";
      }
      
      // Convert to string if it's a BigNumber
      const priceStr = priceInWei.toString();
      
      // Check if it's a valid number
      if (priceStr === "0" || priceStr === "") {
        return "0";
      }
      
      return ethers.formatEther(priceStr);
    } catch (error) {
      console.error("Error formatting price:", error, "Value:", priceInWei);
      return "0";
    }
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getStatusBadge = (listing) => {
    if (listing.lockExpiry > Date.now() / 1000) {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Locked</span>;
    } else if (listing.isActive) {
      return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Active</span>;
    } else {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">Inactive</span>;
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
          ))}
          
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-2">💡 About Your Energy Offers</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Offers are automatically managed by the MultiBus contract</li>
              <li>• Energy is measured in Watt-hours (Wh) for precision</li>
              <li>• Offers may be temporarily locked during transactions</li>
              <li>• Each offer is tied to a specific energy bus</li>
              <li>• Multiple buyers can purchase portions of your offers</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyListings;
