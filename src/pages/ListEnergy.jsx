import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const ListEnergy = () => {
  const { contract, account } = useWeb3();
  const [formData, setFormData] = useState({
    energyAmount: '',
    pricePerKWh: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract || !account) {
      alert('Please connect your wallet first');
      return;
    }

    const { energyAmount, pricePerKWh } = formData;
    
    if (!energyAmount || !pricePerKWh) {
      alert('Please fill in all fields');
      return;
    }

    if (parseFloat(energyAmount) <= 0 || parseFloat(pricePerKWh) <= 0) {
      alert('Values must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      // Convert price to wei
      const priceInWei = ethers.parseEther(pricePerKWh);
      
      const tx = await contract.listEnergy(
        parseInt(energyAmount),
        priceInWei
      );
      
      await tx.wait();
      
      alert('Energy listed successfully!');
      setFormData({ energyAmount: '', pricePerKWh: '' });
      
    } catch (err) {
      console.error('Error listing energy:', err);
      alert('Failed to list energy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const { energyAmount, pricePerKWh } = formData;
    if (energyAmount && pricePerKWh) {
      return (parseFloat(energyAmount) * parseFloat(pricePerKWh)).toFixed(4);
    }
    return '0';
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">List Your Energy</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
          Please connect your wallet to list energy for sale
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Energy</h1>
        <p className="text-gray-600">Sell your excess renewable energy to the community</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="energyAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Energy Amount (kWh)
            </label>
            <input
              type="number"
              id="energyAmount"
              name="energyAmount"
              value={formData.energyAmount}
              onChange={handleInputChange}
              placeholder="Enter energy amount in kWh"
              className="input-field"
              min="1"
              step="1"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              The amount of energy you want to sell in kilowatt-hours
            </p>
          </div>

          <div>
            <label htmlFor="pricePerKWh" className="block text-sm font-medium text-gray-700 mb-2">
              Price per kWh (ETH)
            </label>
            <input
              type="number"
              id="pricePerKWh"
              name="pricePerKWh"
              value={formData.pricePerKWh}
              onChange={handleInputChange}
              placeholder="Enter price per kWh in ETH"
              className="input-field"
              min="0.001"
              step="0.001"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Your asking price per kilowatt-hour in ETH
            </p>
          </div>

          {formData.energyAmount && formData.pricePerKWh && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Listing Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Energy Amount:</span>
                  <span>{formData.energyAmount} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>Price per kWh:</span>
                  <span>{formData.pricePerKWh} ETH</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Price:</span>
                  <span>{calculateTotal()} ETH</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Listing Energy...' : 'List Energy for Sale'}
          </button>
        </form>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tips for Listing Energy</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Set competitive prices to attract buyers</li>
          <li>• Consider market rates for renewable energy in your area</li>
          <li>• Ensure you have the energy available before listing</li>
          <li>• You can cancel listings if needed</li>
        </ul>
      </div>
    </div>
  );
};

export default ListEnergy;
