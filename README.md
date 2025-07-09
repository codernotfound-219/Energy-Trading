# MultiBus P2P Energy Trading Platform

A sophisticated decentralized peer-to-peer energy trading platform built with React, Vite, and advanced Ethereum smart contracts. This application enables users to trade renewable energy across multiple energy buses (grids) with concurrent transaction support and collaborative ownership models.

## 🚀 Key Features

### Multi-Bus Architecture
- **Energy Bus System**: Organize energy trading into separate grids/sources (Solar Farm A, Wind Farm B, etc.)
- **Multiple Ownership**: Each energy bus can have multiple co-owners
- **Capacity Management**: Real-time tracking of energy capacity and availability
- **Bus-Specific Trading**: Trade energy within specific energy networks

### Concurrent Transaction Safety
- **Lock-Free Purchases**: Handle multiple simultaneous purchases safely
- **Transaction Nonce System**: Prevent replay attacks and ensure transaction ordering
- **Unique Transaction Hashing**: Each transaction gets a cryptographic hash for tracking
- **5-minute Lock Duration**: Temporary locks prevent double-spending during high-frequency trading

### Advanced Trading Features
- **Partial Purchases**: Buy any amount up to the full offer
- **Batch Purchases**: Buy from multiple offers in a single transaction
- **Watt-hour Precision**: Energy measured in Watt-hours (Wh) for precise trading
- **Real-time Lock Status**: See when offers are temporarily locked by other transactions

### Modern UI/UX
- **Bus Selection Interface**: Choose which energy bus to browse
- **Real-time Capacity Display**: See available capacity for each energy bus
- **Lock Status Indicators**: Visual feedback for offer availability
- **Collaborative Bus Creation**: Interface for creating multi-owner energy buses

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
   npx hardhat node --port 8545
   ```
   This will start a local Hardhat network on `http://localhost:8545`
   
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

## Smart Contract Architecture

The `MultiBusEnergyTrading.sol` contract provides advanced energy trading functionality with concurrent transaction support:

### Core Data Structures

- **EnergyBus**: Represents energy grids with multiple owners, capacity management, and base pricing
- **EnergyOffer**: Individual energy offers tied to specific buses with lock expiry for concurrent safety
- **EnergyPurchase**: Detailed purchase records with transaction hashes for tracking
- **TransactionLock**: Manages concurrent transaction safety with temporary locks

### Key Functions

#### Bus Management
- `createEnergyBus(string _name, address[] _owners, uint256 _capacity, uint256 _basePrice)`: Create new energy bus
- `addBusOwner(uint256 _busId, address _newOwner)`: Add new owner to existing bus
- `getBusDetails(uint256 _busId)`: Get bus information including capacity and owners

#### Energy Trading
- `createOffer(uint256 _busId, uint256 _energyAmount, uint256 _pricePerUnit)`: Create energy offer on specific bus
- `purchaseEnergy(uint256 _offerId, uint256 _energyAmount, uint256 _nonce)`: Purchase energy with concurrent safety
- `batchPurchaseEnergy(uint256[] _offerIds, uint256[] _energyAmounts, uint256 _nonce)`: Buy from multiple offers
- `confirmEnergyTransfer(uint256 _purchaseId)`: Confirm physical energy transfer completion

#### Query Functions
- `getBusActiveOffers(uint256 _busId)`: Get all active offers for a specific bus
- `getUserBuses(address _user)`: Get all buses owned by a user
- `getUserBusOffers(uint256 _busId, address _user)`: Get user's offers on specific bus
- `isTransactionProcessed(bytes32 _txHash)`: Check if transaction was already processed

### Advanced Features

#### Concurrent Transaction Safety
- **Nonce System**: Each user has an incrementing nonce to prevent replay attacks
- **Transaction Hashing**: Unique hashes prevent duplicate transaction processing
- **Temporary Locks**: 5-minute locks during purchase processing prevent double-spending
- **Lock Expiry Checks**: Automatic lock validation for high-frequency trading

#### Multi-Bus Organization
- **Bus-Specific Capacity**: Each bus tracks total and available capacity independently
- **Cross-Bus Trading**: Users can participate in multiple energy buses simultaneously  
- **Owner Verification**: Multi-signature-like ownership verification for bus operations

### Events

- `BusCreated`: Emitted when new energy bus is created
- `OfferCreated`: Emitted when energy offer is posted
- `OfferLocked/OfferUnlocked`: Track offer locking during concurrent transactions
- `EnergyPurchased`: Emitted for each energy purchase with full transaction details
- `ConcurrentPurchaseProcessed`: Track concurrent transaction processing
- `PurchaseCompleted`: Emitted when seller confirms energy transfer

## MetaMask Setup

1. **Install MetaMask**: Download and install the MetaMask browser extension
2. **Connect to Local Network**:
   - Network Name: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

3. **Import Test Accounts**: Use the private keys provided by Hardhat when you run the blockchain node

## Quick Start Demo

After installation, you can run a demonstration of the smart contract functionality:

```bash
# Terminal 1: Start blockchain
npx hardhat node --port 8545

# Terminal 2: Deploy and run demo
npm run deploy
npm run demo
```

The demo will:
- Deploy the MultiBusEnergyTrading smart contract
- Create sample energy buses with multiple owners
- Create energy offers on different buses
- Simulate concurrent energy purchases
- Demonstrate batch purchase functionality
- Show multi-bus marketplace activity
- Display transaction results and gas usage

This proves the advanced smart contract features work before testing with the frontend!

## Usage Guide

### Creating Energy Buses

1. **Connect Wallet**: Click "Connect Wallet" and select your MetaMask account
2. **Navigate to Energy Management**: Go to "List Energy" page which includes bus creation
3. **Create New Bus**:
   - Enter bus name (e.g., "Solar Farm Alpha")
   - Add additional owner addresses (comma-separated, optional)
   - Set total capacity in Watt-hours (Wh)
   - Set base price per Wh in ETH
   - Submit to create the bus

### For Energy Sellers

1. **Select or Create Bus**: Choose an existing energy bus or create a new one
2. **Create Energy Offer**:
   - Select the energy bus from dropdown
   - Enter energy amount in Watt-hours (Wh)
   - Set your price per Wh in ETH
   - Submit the offer
3. **Monitor Offers**: Track your offers across different buses
4. **Confirm Transfers**: Confirm when physical energy transfer is completed

### For Energy Buyers

1. **Browse by Bus**: Select an energy bus to see available offers
2. **Partial Purchases**: Enter the amount you want to buy (can be less than full offer)
3. **Single Purchase**: Click "Purchase Energy" for individual offers
4. **Batch Purchase**: Use "Batch Purchase" to buy from multiple offers simultaneously
5. **Monitor Status**: See if offers are temporarily locked by other transactions
6. **Track Purchases**: View your purchase history organized by energy bus

### Advanced Features

#### Concurrent Trading
- **Lock Awareness**: Interface shows when offers are temporarily locked
- **Nonce Management**: System automatically manages transaction nonces
- **Retry Logic**: Built-in handling for concurrent transaction conflicts

#### Multi-Bus Management
- **Bus Ownership**: Co-own energy buses with other users
- **Cross-Bus Trading**: Participate in multiple energy networks
- **Capacity Tracking**: Real-time visibility into bus capacity and availability

## Development Scripts

- `npm run dev`: Start frontend development server
- `npm run build`: Build frontend for production
- `npm run preview`: Preview production build
- `npm run compile`: Compile smart contracts
- `npm run test`: Run smart contract tests
- `npm run deploy`: Deploy contracts to local network
- `npm run demo`: Run smart contract demonstration
- `npx hardhat node --port 8545`: Start local Hardhat network

### Typical Development Workflow

1. **Start blockchain**: `npx hardhat node --port 8545` (keep running)
2. **Deploy contracts**: `npm run deploy`
3. **Test contracts**: `npm run demo` (optional)
4. **Start frontend**: `npm run dev`
5. **Connect MetaMask** to localhost:8545
6. **Import test accounts** from Hardhat output
7. **Start trading energy!**

## Project Structure

```
Energy-Trading/
├── contracts/                    # Smart contracts
│   └── EnergyTrading.sol        # MultiBusEnergyTrading contract
├── scripts/                     # Deployment and utility scripts
│   ├── deploy.js               # Contract deployment script
│   └── demo.js                 # Contract demonstration script
├── test/                       # Smart contract tests
│   └── EnergyTrading.test.js   # Comprehensive test suite
├── src/                        # React frontend
│   ├── components/             # React components
│   │   ├── EnergyCard.jsx     # Energy offer display with concurrent features
│   │   ├── ErrorBoundary.jsx  # Error handling component
│   │   └── Navbar.jsx         # Navigation component
│   ├── context/               # React context providers
│   │   └── Web3Context.jsx    # Web3 and contract integration
│   ├── pages/                 # Page components
│   │   ├── Home.jsx           # Multi-bus marketplace browser
│   │   ├── ListEnergy.jsx     # Bus creation and offer management
│   │   ├── MyListings.jsx     # User's offers across buses
│   │   └── MyPurchases.jsx    # User's purchase history
│   ├── utils/                 # Utility functions
│   │   └── csp-handler.js     # Content Security Policy handling
│   ├── App.jsx                # Main app component with routing
│   ├── main.jsx               # App entry point
│   └── index.css              # Global styles with Tailwind
├── artifacts/                  # Compiled contract artifacts
├── cache/                      # Hardhat compilation cache
├── public/                     # Static assets
│   ├── contract.json          # Deployed contract ABI and address
│   └── favicon.svg            # App icon
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite bundler configuration
└── tailwind.config.js         # Tailwind CSS configuration
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
   - Verify the blockchain node is running on port 8545

3. **Transaction Failures**
   - Make sure you have sufficient ETH for gas fees
   - Check that the listing is still active and available
   - Verify you're not trying to buy your own listing

4. **Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Make sure you have the correct Node.js version

5. **Demo Script Issues**
   - Ensure blockchain node is running: `npx hardhat node --port 8545`
   - Redeploy contract if blockchain restarted: `npm run deploy`
   - Check terminal output for error messages

6. **Content Security Policy (CSP) Issues**
   - The app is configured with proper CSP headers for development
   - If you still see CSP errors about 'eval', they're usually from browser extensions
   - These warnings don't affect functionality in development mode
   - Try disabling browser extensions or use incognito mode if needed
   - The app will automatically handle CSP in both development and production

7. **Port Already in Use**
   - If port 3000 is busy, Vite will automatically use another port (like 3001)
   - Update your browser URL accordingly
   - Or kill the process: `lsof -ti:3000 | xargs kill -9`

### Reset Everything

If you encounter persistent issues:

```bash
# Stop all processes
pkill -f hardhat

# Clean build artifacts
rm -rf artifacts cache src/contract.json

# Restart blockchain
npx hardhat node --port 8545

# Redeploy (in new terminal)
npm run deploy

# Test with demo
npm run demo
```
