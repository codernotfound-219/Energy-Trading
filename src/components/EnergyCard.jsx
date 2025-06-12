import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const EnergyCard = ({ listing, onPurchaseSuccess }) => {
  const { contract, account } = useWeb3();
  const [purchasing, setPurchasing] = useState(false);

  if (!listing) {
    return null;
  }

  const handlePurchase = async () => {
    if (!contract || !account) return;

    try {
      setPurchasing(true);
      
      const listingId = listing.id || listing[0];
      const totalPrice = listing.totalPrice || listing[4];
      
      const tx = await contract.purchaseEnergy(listingId, {
        value: totalPrice
      });
      
      await tx.wait();
      
      alert('Energy purchased successfully!');
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }
    } catch (err) {
      console.error('Error purchasing energy:', err);
      alert('Failed to purchase energy. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (priceInWei) => {
    try {
      if (!priceInWei) return '0';
      return ethers.formatEther(priceInWei);
    } catch (err) {
      console.error('Error formatting price:', err);
      return '0';
    }
  };

  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'Unknown';
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleDateString();
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Unknown';
    }
  };

  // Extract values with fallbacks for both array and object formats
  const energyAmount = listing.energyAmount || listing[2] || 0;
  const pricePerKWh = listing.pricePerKWh || listing[3] || 0;
  const totalPrice = listing.totalPrice || listing[4] || 0;
  const seller = listing.seller || listing[1] || '';
  const timestamp = listing.timestamp || listing[7] || 0;

  const isOwnListing = seller && account && seller.toLowerCase() === account.toLowerCase();

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {energyAmount.toString()} kWh
          </h3>
          <p className="text-sm text-gray-600">
            Listed on {formatDate(timestamp)}
          </p>
        </div>
        <div className="bg-energy-green text-white px-2 py-1 rounded text-sm">
          Available
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Price per kWh:</span>
          <span className="font-medium">{formatPrice(pricePerKWh)} ETH</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total Price:</span>
          <span className="font-bold text-lg">{formatPrice(totalPrice)} ETH</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Seller:</span>
          <span className="font-mono text-sm">
            {seller ? `${seller.slice(0, 6)}...${seller.slice(-4)}` : 'Unknown'}
          </span>
        </div>
      </div>

      {isOwnListing ? (
        <button
          disabled
          className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
        >
          Your Listing
        </button>
      ) : (
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {purchasing ? 'Purchasing...' : 'Purchase Energy'}
        </button>
      )}
    </div>
  );
};

export default EnergyCard;
