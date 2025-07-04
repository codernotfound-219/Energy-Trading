const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MultiBusEnergyTrading contract...");

  // Get the ContractFactory and Signers here.
  const MultiBusEnergyTrading = await ethers.getContractFactory("MultiBusEnergyTrading");
  
  // Deploy the contract
  const multiBusEnergyTrading = await MultiBusEnergyTrading.deploy();
  
  await multiBusEnergyTrading.waitForDeployment();
  
  const contractAddress = await multiBusEnergyTrading.getAddress();
  console.log("MultiBusEnergyTrading contract deployed to:", contractAddress);

  // Save the contract address and ABI to the frontend
  const fs = require('fs');
  const contractData = {
    address: contractAddress,
    abi: multiBusEnergyTrading.interface.fragments.map(fragment => fragment.format('json')).map(f => JSON.parse(f))
  };

  // Create src directory if it doesn't exist
  if (!fs.existsSync('./src')) {
    fs.mkdirSync('./src');
  }

  // Create public directory if it doesn't exist
  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public');
  }

  // Save to both src and public directories
  fs.writeFileSync(
    './src/contract.json',
    JSON.stringify(contractData, null, 2)
  );

  fs.writeFileSync(
    './public/contract.json',
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract address and ABI saved to src/contract.json and public/contract.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
