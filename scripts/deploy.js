const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying EnergyTrading contract...");

  // Get the ContractFactory and Signers here.
  const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
  
  // Deploy the contract
  const energyTrading = await EnergyTrading.deploy();
  
  await energyTrading.waitForDeployment();
  
  const contractAddress = await energyTrading.getAddress();
  console.log("EnergyTrading contract deployed to:", contractAddress);

  // Save the contract address and ABI to the frontend
  const fs = require('fs');
  const contractData = {
    address: contractAddress,
    abi: energyTrading.interface.format('json')
  };

  // Create src directory if it doesn't exist
  if (!fs.existsSync('./src')) {
    fs.mkdirSync('./src');
  }

  fs.writeFileSync(
    './src/contract.json',
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract address and ABI saved to src/contract.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
