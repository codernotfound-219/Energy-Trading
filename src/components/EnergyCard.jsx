import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const EnergyCard = ({ offer, userNonce, onPurchaseSuccess }) => {
  const { contract, account } = useWeb3();
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState('');

  if (!offer) {
    return null;
  }

  const handlePurchase = async () => {
    if (!contract || !account) return;

    const amount = parseInt(purchaseAmount) || offer.energyAmount;
    
    if (amount <= 0 || amount > offer.energyAmount) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setPurchasing(true);
      
      const totalPrice = BigInt(amount) * BigInt(offer.pricePerUnit);
      
      console.log('Purchasing energy:', {
        offerId: offer.id,
        amount: amount,
        nonce: userNonce,
        totalPrice: totalPrice.toString()
      });
      
      const tx = await contract.purchaseEnergy(
        offer.id,
        amount,
        userNonce,
        { value: totalPrice }
      );
      
      await tx.wait();
      
      alert('Energy purchased successfully!');
      setPurchaseAmount('');
      
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }
    } catch (err) {
      console.error('Error purchasing energy:', err);
      
      if (err.message.includes('Transaction already processed')) {
        alert('Transaction already processed. Please refresh the page.');
      } else if (err.message.includes('Invalid nonce')) {
        alert('Invalid nonce. Please refresh the page.');
      } else if (err.message.includes('Offer is locked')) {
        alert('This offer is temporarily locked by another transaction. Please try again in a few minutes.');
      } else {
        alert('Failed to purchase energy. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleBatchPurchase = async () => {
    if (!contract || !account) return;

    const amount = parseInt(purchaseAmount) || offer.energyAmount;
    
    if (amount <= 0 || amount > offer.energyAmount) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setPurchasing(true);
      
      const totalPrice = BigInt(amount) * BigInt(offer.pricePerUnit);
      
      console.log('Batch purchasing energy:', {
        offerIds: [offer.id],
        amounts: [amount],
        nonce: userNonce,
        totalPrice: totalPrice.toString()
      });
      
      const tx = await contract.batchPurchaseEnergy(
        [offer.id],
        [amount],
        userNonce,
        { value: totalPrice }
      );
      
      await tx.wait();
      
      alert('Energy purchased successfully via batch!');
      setPurchaseAmount('');
      
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }
    } catch (err) {
      console.error('Error batch purchasing energy:', err);
      alert('Failed to batch purchase energy. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (priceInWei) => {
    try {
      if (!priceInWei) return '0';
      return ethers.formatEther(priceInWei.toString());
    } catch (err) {
      console.error('Error formatting price:', err);
      return '0';
    }
  };

  const calculateTotalPrice = () => {
    const amount = parseInt(purchaseAmount) || offer.energyAmount;
    const total = BigInt(amount) * BigInt(offer.pricePerUnit);
    return formatPrice(total);
  };

  const isOwnOffer = offer.seller && account && offer.seller.toLowerCase() === account.toLowerCase();
  const isLocked = offer.lockExpiry && Number(offer.lockExpiry) * 1000 > Date.now();

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {offer.energyAmount.toString()} Wh
          </h3>
          <p className="text-sm text-gray-600">
            Bus ID: {offer.busId.toString()}
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-sm ${
          isLocked 
            ? 'bg-red-100 text-red-800' 
            : 'bg-energy-green text-white'
        }`}>
          {isLocked ? 'Locked' : 'Available'}
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Price per Wh:</span>
          <span className="font-medium">{formatPrice(offer.pricePerUnit)} ETH</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Available Amount:</span>
          <span className="font-medium">{offer.energyAmount.toString()} Wh</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Seller:</span>
          <span className="font-mono text-sm">
            {offer.seller ? `${offer.seller.slice(0, 6)}...${offer.seller.slice(-4)}` : 'Unknown'}
          </span>
        </div>
      </div>

      {!isOwnOffer && !isLocked && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchase Amount (Wh)
          </label>
          <input
            type="number"
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            placeholder={`Max: ${offer.energyAmount.toString()}`}
            className="input-field"
            min="1"
            max={offer.energyAmount.toString()}
          />
          {purchaseAmount && (
            <p className="text-sm text-gray-600 mt-1">
              Total: {calculateTotalPrice()} ETH
            </p>
          )}
        </div>
      )}

      {isOwnOffer ? (
        <button
          disabled
          className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
        >
          Your Offer
        </button>
      ) : isLocked ? (
        <button
          disabled
          className="w-full bg-red-300 text-red-500 py-2 px-4 rounded-lg cursor-not-allowed"
        >
          Temporarily Locked
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {purchasing ? 'Purchasing...' : 'Purchase Energy'}
          </button>
          
          <button
            onClick={handleBatchPurchase}
            disabled={purchasing}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {purchasing ? 'Batch Purchasing...' : 'Batch Purchase'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EnergyCard;
