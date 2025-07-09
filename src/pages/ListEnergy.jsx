import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

const ListEnergy = () => {
  const { contract, account } = useWeb3();
  const [formData, setFormData] = useState({
    busId: '',
    energyAmount: '',
    pricePerUnit: ''
  });
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      console.error('Error loading buses:', err);
    }
  };

  useEffect(() => {
    if (contract) {
      loadBuses();
    }
  }, [contract]);

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

    const { busId, energyAmount, pricePerUnit } = formData;
    
    if (!busId || !energyAmount || !pricePerUnit) {
      alert('Please fill in all fields');
      return;
    }

    if (parseFloat(energyAmount) <= 0 || parseFloat(pricePerUnit) <= 0) {
      alert('Values must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      // Convert price to wei
      const priceInWei = ethers.parseEther(pricePerUnit);
      
      const tx = await contract.createOffer(
        parseInt(busId),
        parseInt(energyAmount),
        priceInWei
      );
      
      console.log('Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      alert('Energy offer created successfully!');
      
      // Reset form
      setFormData({
        busId: '',
        energyAmount: '',
        pricePerUnit: ''
      });
      
    } catch (err) {
      console.error('Error creating offer:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">List Energy for Sale</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
          Please connect your wallet to list energy for sale
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">List Energy for Sale</h1>
        <p className="text-gray-600">Create energy offers on existing energy buses</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {buses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚌</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Energy Buses Available</h3>
            <p className="text-gray-600 mb-6">You need to create an energy bus first before listing energy offers.</p>
            <a href="/create-bus" className="btn-primary">
              Create Energy Bus
            </a>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Energy Offer</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energy Bus *
                </label>
                <select
                  name="busId"
                  value={formData.busId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-energy-blue"
                  required
                >
                  <option value="">Select an energy bus</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.name} - {bus.availableCapacity.toString()} Wh available (Base: {formatPrice(bus.basePrice)} ETH/Wh)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energy Amount (Wh) *
                </label>
                <input
                  type="number"
                  name="energyAmount"
                  value={formData.energyAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-energy-blue"
                  placeholder="e.g., 1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Wh (ETH) *
                </label>
                <input
                  type="number"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={handleInputChange}
                  step="0.000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-energy-blue"
                  placeholder="e.g., 0.001"
                  required
                />
              </div>

              {formData.energyAmount && formData.pricePerUnit && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Offer Summary</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Energy Amount:</span>
                      <span>{formData.energyAmount} Wh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per Wh:</span>
                      <span>{formData.pricePerUnit} ETH</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Value:</span>
                      <span>{(parseFloat(formData.energyAmount) * parseFloat(formData.pricePerUnit)).toFixed(6)} ETH</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Offer...' : 'Create Energy Offer'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListEnergy;