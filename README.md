# P2P Energy Trading Platform

A decentralized peer-to-peer energy trading platform built with React, Vite, and Ethereum smart contracts. This application allows users to buy and sell renewable energy directly with each other using blockchain technology.

## Features

- **Smart Contract Integration**: Secure energy trading using Ethereum smart contracts
- **Modern UI**: Built with React, Vite, and Tailwind CSS
- **Wallet Integration**: Connect with MetaMask to interact with the blockchain
- **Energy Marketplace**: Browse and purchase available energy listings
- **Energy Listing**: List your excess renewable energy for sale
- **Transaction History**: Track your purchases and sales
- **Real-time Updates**: Live updates of energy listings and transactions

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Blockchain**: Ethereum, Solidity, Hardhat
- **Web3**: Ethers.js for blockchain interaction
- **Routing**: React Router DOM

## Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- MetaMask browser extension
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Energy-Trading
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start local blockchain**
   ```bash
   npx hardhat node --port 8546
   ```
   This will start a local Hardhat network on `http://localhost:8546`
   
   ⚠️ **Important**: Keep this terminal running - the blockchain node must stay active for the application to work.

4. **Deploy smart contracts** (in a new terminal)
   ```bash
   npm run compile
   npm run deploy
   ```

5. **Run the demo** (optional but recommended)
   ```bash
   npm run demo
   ```
   This demonstrates the smart contract functionality with sample transactions.

6. **Start the frontend**
   ```bash
   npm run dev
   ```

7. **Access the application**
   Open your browser and go to `http://localhost:3000`

## Smart Contract

The `EnergyTrading.sol` contract provides the following functionality:

### Main Functions

- `listEnergy(uint256 _energyAmount, uint256 _pricePerKWh)`: List energy for sale
- `purchaseEnergy(uint256 _listingId)`: Purchase energy from a listing
- `cancelListing(uint256 _listingId)`: Cancel an active listing
- `getActiveListings()`: Get all available energy listings
- `getUserListings(address _user)`: Get user's listings
- `getUserPurchases(address _user)`: Get user's purchase history
- `getUserEnergyBalance(address _user)`: Get user's energy balance

### Events

- `EnergyListed`: Emitted when energy is listed for sale
- `EnergyPurchased`: Emitted when energy is purchased
- `ListingCancelled`: Emitted when a listing is cancelled

## MetaMask Setup

1. **Install MetaMask**: Download and install the MetaMask browser extension
2. **Connect to Local Network**:
   - Network Name: Localhost 8546
   - RPC URL: http://localhost:8546
   - Chain ID: 1337
   - Currency Symbol: ETH

3. **Import Test Accounts**: Use the private keys provided by Hardhat when you run the blockchain node

## Quick Start Demo

After installation, you can run a demonstration of the smart contract functionality:

```bash
# Terminal 1: Start blockchain
npx hardhat node --port 8546

# Terminal 2: Deploy and run demo
npm run deploy
npm run demo
```

The demo will:
- Deploy the EnergyTrading smart contract
- Create sample energy listings
- Simulate energy purchases
- Show marketplace activity
- Display transaction results

This proves the smart contract works before testing with the frontend!

## Usage

### For Energy Sellers

1. **Connect Wallet**: Click "Connect Wallet" and select your MetaMask account
2. **List Energy**: Go to "List Energy" page
   - Enter the amount of energy (kWh) you want to sell
   - Set your price per kWh in ETH
   - Submit the listing
3. **Manage Listings**: View and cancel your listings in "My Listings"

### For Energy Buyers

1. **Connect Wallet**: Click "Connect Wallet" and select your MetaMask account
2. **Browse Marketplace**: View available energy listings on the home page
3. **Purchase Energy**: Click "Purchase Energy" on any listing you want to buy
4. **Track Purchases**: View your purchase history in "My Purchases"

## Development Scripts

- `npm run dev`: Start frontend development server
- `npm run build`: Build frontend for production
- `npm run preview`: Preview production build
- `npm run compile`: Compile smart contracts
- `npm run test`: Run smart contract tests
- `npm run deploy`: Deploy contracts to local network
- `npm run demo`: Run smart contract demonstration
- `npx hardhat node --port 8546`: Start local Hardhat network

### Typical Development Workflow

1. **Start blockchain**: `npx hardhat node --port 8546` (keep running)
2. **Deploy contracts**: `npm run deploy`
3. **Test contracts**: `npm run demo` (optional)
4. **Start frontend**: `npm run dev`
5. **Connect MetaMask** to localhost:8546
6. **Import test accounts** from Hardhat output
7. **Start trading energy!**

## Project Structure

```
Energy-Trading/
├── contracts/              # Smart contracts
│   └── EnergyTrading.sol   # Main energy trading contract
├── scripts/                # Deployment scripts
│   └── deploy.js          # Contract deployment script
├── src/                   # React frontend
│   ├── components/        # React components
│   ├── context/          # React context providers
│   ├── pages/            # Page components
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # App entry point
│   └── index.css         # Global styles
├── hardhat.config.js     # Hardhat configuration
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**
   - Make sure MetaMask is installed and unlocked
   - Check that you're connected to the correct network (localhost:8546)
   - Refresh the page and try reconnecting

2. **Contract Not Found**
   - Ensure the smart contract is deployed (`npm run deploy`)
   - Check that the contract address in `src/contract.json` is correct
   - Verify the blockchain node is running on port 8546

3. **Transaction Failures**
   - Make sure you have sufficient ETH for gas fees
   - Check that the listing is still active and available
   - Verify you're not trying to buy your own listing

4. **Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Make sure you have the correct Node.js version

5. **Demo Script Issues**
   - Ensure blockchain node is running: `npx hardhat node --port 8546`
   - Redeploy contract if blockchain restarted: `npm run deploy`
   - Check terminal output for error messages

6. **Port Already in Use**
   - If port 8546 is busy, kill the process: `lsof -ti:8546 | xargs kill -9`
   - Or use a different port and update `hardhat.config.js`

### Reset Everything

If you encounter persistent issues:

```bash
# Stop all processes
pkill -f hardhat

# Clean build artifacts
rm -rf artifacts cache src/contract.json

# Restart blockchain
npx hardhat node --port 8546

# Redeploy (in new terminal)
npm run deploy

# Test with demo
npm run demo
```
