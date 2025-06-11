import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const EnergyCard = ({ listing, onPurchaseSuccess }) => {
  const { contract, account } = useWeb3();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!contract || !account) return;

    try {
      setPurchasing(true);
      
      const tx = await contract.purchaseEnergy(listing.id, {
        value: listing.totalPrice
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
    return ethers.formatEther(priceInWei);
  };

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const isOwnListing = listing.seller.toLowerCase() === account?.toLowerCase();

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {listing.energyAmount.toString()} kWh
          </h3>
          <p className="text-sm text-gray-600">
            Listed on {formatDate(listing.timestamp)}
          </p>
        </div>
        <div className="bg-energy-green text-white px-2 py-1 rounded text-sm">
          Available
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Price per kWh:</span>
          <span className="font-medium">{formatPrice(listing.pricePerKWh)} ETH</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total Price:</span>
          <span className="font-bold text-lg">{formatPrice(listing.totalPrice)} ETH</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Seller:</span>
          <span className="font-mono text-sm">
            {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
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
