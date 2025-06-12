const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 P2P Energy Trading Demo");
  console.log("========================\n");

  // Get signers
  const [deployer, seller, buyer] = await ethers.getSigners();
  
  console.log("👥 Demo Accounts:");
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Seller: ${seller.address}`);
  console.log(`Buyer: ${buyer.address}\n`);

  // Deploy contract
  console.log("📝 Deploying EnergyTrading contract...");
  const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
  const energyTrading = await EnergyTrading.deploy();
  await energyTrading.waitForDeployment();
  
  const contractAddress = await energyTrading.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}\n`);

  // Demo 1: List energy for sale
  console.log("🔋 Demo 1: Listing Energy for Sale");
  console.log("----------------------------------");
  
  const energyAmount = 100; // 100 kWh
  const pricePerKWh = ethers.parseEther("0.1"); // 0.1 ETH per kWh
  
  console.log(`Seller listing ${energyAmount} kWh at ${ethers.formatEther(pricePerKWh)} ETH per kWh`);
  
  const listTx = await energyTrading.connect(seller).listEnergy(energyAmount, pricePerKWh);
  await listTx.wait();
  
  console.log("✅ Energy listed successfully!");
  
  // Check listing
  const listing = await energyTrading.listings(1);
  console.log(`📋 Listing Details:`);
  console.log(`   - ID: ${listing.id}`);
  console.log(`   - Energy: ${listing.energyAmount} kWh`);
  console.log(`   - Price: ${ethers.formatEther(listing.pricePerKWh)} ETH per kWh`);
  console.log(`   - Total: ${ethers.formatEther(listing.totalPrice)} ETH`);
  console.log(`   - Active: ${listing.isActive}\n`);

  // Demo 2: Purchase energy
  console.log("💰 Demo 2: Purchasing Energy");
  console.log("----------------------------");
  
  const totalPrice = listing.totalPrice;
  console.log(`Buyer purchasing energy for ${ethers.formatEther(totalPrice)} ETH`);
  
  const buyTx = await energyTrading.connect(buyer).purchaseEnergy(1, { value: totalPrice });
  await buyTx.wait();
  
  console.log("✅ Energy purchased successfully!");
  
  // Check updated listing
  const updatedListing = await energyTrading.listings(1);
  console.log(`📋 Updated Listing:`);
  console.log(`   - Active: ${updatedListing.isActive}`);
  console.log(`   - Sold: ${updatedListing.isSold}`);
  
  // Check buyer's energy balance
  const buyerBalance = await energyTrading.getUserEnergyBalance(buyer.address);
  console.log(`🔋 Buyer's Energy Balance: ${buyerBalance} kWh\n`);

  // Demo 3: View marketplace
  console.log("🏪 Demo 3: Marketplace Overview");
  console.log("------------------------------");
  
  // Add another listing
  await energyTrading.connect(seller).listEnergy(200, ethers.parseEther("0.08"));
  await energyTrading.connect(buyer).listEnergy(50, ethers.parseEther("0.12"));
  
  const activeListings = await energyTrading.getActiveListings();
  console.log(`📊 Active Listings: ${activeListings.length}`);
  
  activeListings.forEach((listing, index) => {
    console.log(`   ${index + 1}. ${listing.energyAmount} kWh at ${ethers.formatEther(listing.pricePerKWh)} ETH/kWh (${ethers.formatEther(listing.totalPrice)} ETH total)`);
  });

  console.log("\n🎉 Demo completed successfully!");
  console.log("\n💡 Next Steps:");
  console.log("1. Start the local blockchain: npm run node");
  console.log("2. Deploy contracts: npm run deploy");
  console.log("3. Start the frontend: npm run dev");
  console.log("4. Connect MetaMask to http://localhost:8546");
  console.log("5. Import test accounts using private keys from Hardhat");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
