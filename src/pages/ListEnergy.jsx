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
  const [creatingBus, setCreatingBus] = useState(false);
  const [busFormData, setBusFormData] = useState({
    name: '',
    owners: '',
    capacity: '',
    basePrice: ''
  });

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

  const handleBusInputChange = (e) => {
    const { name, value } = e.target;
    setBusFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateBus = async (e) => {
    e.preventDefault();
    
    if (!contract || !account) {
      alert('Please connect your wallet first');
      return;
    }

    const { name, owners, capacity, basePrice } = busFormData;
    
    if (!name || !capacity || !basePrice) {
      alert('Please fill in all required fields (name, capacity, and base price)');
      return;
    }

    if (parseFloat(capacity) <= 0 || parseFloat(basePrice) <= 0) {
      alert('Capacity and base price must be greater than 0');
      return;
    }

    try {
      setCreatingBus(true);
      
      // Parse owners - split by comma and trim whitespace, filter out empty strings
      let ownerAddresses = [];
      if (owners.trim()) {
        ownerAddresses = owners.split(',').map(addr => addr.trim()).filter(addr => addr !== '');
      }
      
      // Add current account if not already in list
      if (!ownerAddresses.includes(account)) {
        ownerAddresses.push(account);
      }
      
      // Convert base price to wei
      const basePriceInWei = ethers.parseEther(basePrice);
      
      const tx = await contract.createEnergyBus(
        name,
        ownerAddresses,
        parseInt(capacity),
        basePriceInWei
      );
      
      await tx.wait();
      
      alert('Energy bus created successfully!');
      setBusFormData({ name: '', owners: '', capacity: '', basePrice: '' });
      await loadBuses();
      
    } catch (err) {
      console.error('Error creating bus:', err);
      alert('Failed to create energy bus. Please try again.');
    } finally {
      setCreatingBus(false);
    }
  };

  const handleCreateOffer = async (e) => {
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
      
      await tx.wait();
      
      alert('Energy offer created successfully!');
      setFormData({ busId: '', energyAmount: '', pricePerUnit: '' });
      await loadBuses(); // Refresh bus data to show updated available capacity
      
    } catch (err) {
      console.error('Error creating offer:', err);
      
      if (err.message.includes('Insufficient bus capacity')) {
        alert('Insufficient bus capacity. Please choose a lower amount.');
      } else {
        alert('Failed to create energy offer. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const { energyAmount, pricePerUnit } = formData;
    if (energyAmount && pricePerUnit) {
      return (parseFloat(energyAmount) * parseFloat(pricePerUnit)).toFixed(6);
    }
    return '0';
  };

  if (!account) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Energy Offer</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg inline-block">
          Please connect your wallet to create energy offers
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Energy Management</h1>
        <p className="text-gray-600">Create energy buses and offers for trading</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Bus Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Energy Bus</h2>
          
          <form onSubmit={handleCreateBus} className="space-y-4">
            <div>
              <label htmlFor="busName" className="block text-sm font-medium text-gray-700 mb-2">
                Bus Name
              </label>
              <input
                type="text"
                id="busName"
                name="name"
                value={busFormData.name}
                onChange={handleBusInputChange}
                placeholder="e.g., Solar Farm A"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="owners" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Owners <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="owners"
                name="owners"
                value={busFormData.owners}
                onChange={handleBusInputChange}
                placeholder="0x123..., 0x456... (leave empty to be sole owner)"
                className="input-field"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your address will be automatically included as an owner
              </p>
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                Total Capacity (Wh)
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={busFormData.capacity}
                onChange={handleBusInputChange}
                placeholder="Enter total capacity in Watt-hours"
                className="input-field"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Base Price per Wh (ETH)
              </label>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                value={busFormData.basePrice}
                onChange={handleBusInputChange}
                placeholder="Enter base price per Wh in ETH"
                className="input-field"
                min="0.000001"
                step="0.000001"
                required
              />
            </div>

            <button
              type="submit"
              disabled={creatingBus}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingBus ? 'Creating Bus...' : 'Create Energy Bus'}
            </button>
          </form>
        </div>

        {/* Create Offer Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Energy Offer</h2>
          
          <form onSubmit={handleCreateOffer} className="space-y-4">
            <div>
              <label htmlFor="busId" className="block text-sm font-medium text-gray-700 mb-2">
                Select Energy Bus
              </label>
              <select
                id="busId"
                name="busId"
                value={formData.busId}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <option value="">Choose a bus</option>
                {buses.filter(bus => bus.isActive).map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.name} - {bus.availableCapacity.toString()} Wh available
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="energyAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Energy Amount (Wh)
              </label>
              <input
                type="number"
                id="energyAmount"
                name="energyAmount"
                value={formData.energyAmount}
                onChange={handleInputChange}
                placeholder="Enter energy amount in Watt-hours"
                className="input-field"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-2">
                Price per Wh (ETH)
              </label>
              <input
                type="number"
                id="pricePerUnit"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleInputChange}
                placeholder="Enter price per Wh in ETH"
                className="input-field"
                min="0.000001"
                step="0.000001"
                required
              />
            </div>

            {formData.energyAmount && formData.pricePerUnit && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Offer Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Energy Amount:</span>
                    <span>{formData.energyAmount} Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price per Wh:</span>
                    <span>{formData.pricePerUnit} ETH</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Total Value:</span>
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
              {loading ? 'Creating Offer...' : 'Create Energy Offer'}
            </button>
          </form>
        </div>
      </div>

      {/* Existing Buses */}
      {buses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Energy Buses</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {buses.map((bus) => (
              <div key={bus.id} className="card">
                <h3 className="font-medium text-gray-900 mb-2">{bus.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Capacity:</span>
                    <span>{bus.totalCapacity.toString()} Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span>{bus.availableCapacity.toString()} Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>{ethers.formatEther(bus.basePrice)} ETH/Wh</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owners:</span>
                    <span>{bus.owners.length} owner(s)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tips for Energy Trading</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Create energy buses to organize different energy sources</li>
          <li>• Set competitive prices to attract buyers</li>
          <li>• Multiple owners can manage the same energy bus</li>
          <li>• Energy is measured in Watt-hours (Wh) for precision</li>
          <li>• Use batch purchases for buying from multiple offers</li>
        </ul>
      </div>
    </div>
  );
};

export default ListEnergy;
