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
   npm run node
   ```
   This will start a local Hardhat network on `http://localhost:8545`

4. **Deploy smart contracts** (in a new terminal)
   ```bash
   npm run compile
   npm run deploy
   ```

5. **Start the frontend**
   ```bash
   npm run dev
   ```

6. **Access the application**
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
   - Network Name: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

3. **Import Test Accounts**: Use the private keys provided by Hardhat when you run `npm run node`

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

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run compile`: Compile smart contracts
- `npm run test`: Run smart contract tests
- `npm run deploy`: Deploy contracts to local network
- `npm run node`: Start local Hardhat network

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
   - Check that you're connected to the correct network (localhost:8545)
   - Refresh the page and try reconnecting

2. **Contract Not Found**
   - Ensure the smart contract is deployed (`npm run deploy`)
   - Check that the contract address in `src/contract.json` is correct

3. **Transaction Failures**
   - Make sure you have sufficient ETH for gas fees
   - Check that the listing is still active and available
   - Verify you're not trying to buy your own listing

4. **Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Make sure you have the correct Node.js version
