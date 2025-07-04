// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiBusEnergyTrading {
    // Energy Bus System - Different energy sources/grids
    struct EnergyBus {
        uint256 id;
        string name;
        address[] owners; // Multiple owners per bus
        uint256 totalCapacity; // Total energy capacity in Wh
        uint256 availableCapacity; // Currently available energy
        uint256 basePrice; // Base price per Wh in Wei
        bool isActive;
        mapping(address => bool) isOwner;
        uint256 ownerCount;
    }
    
    struct EnergyOffer {
        uint256 id;
        uint256 busId; // Which bus this offer belongs to
        address seller;
        uint256 energyAmount; // in Wh (Watt-hours)
        uint256 pricePerUnit; // in Wei per Wh
        bool isActive;
        uint256 timestamp;
        uint256 lockExpiry; // Prevents double-spending during concurrent purchases
    }

    struct EnergyPurchase {
        uint256 id;
        uint256 busId; // Which bus this purchase is from
        uint256 offerId; // Reference to the offer
        address buyer;
        address seller;
        uint256 energyAmount;
        uint256 totalPrice;
        uint256 timestamp;
        bool completed;
        bytes32 transactionHash; // Unique identifier for concurrent processing
    }

    // Concurrent transaction management
    struct TransactionLock {
        uint256 offerId;
        address buyer;
        uint256 amount;
        uint256 lockTime;
        bool isActive;
    }

    // State variables
    uint256 private busIdCounter;
    uint256 private offerIdCounter;
    uint256 private purchaseIdCounter;
    uint256 private lockIdCounter;
    
    // Lock duration for concurrent transactions (5 minutes)
    uint256 public constant LOCK_DURATION = 300;
    
    mapping(uint256 => EnergyBus) public energyBuses;
    mapping(uint256 => EnergyOffer) public energyOffers;
    mapping(uint256 => EnergyPurchase) public energyPurchases;
    mapping(uint256 => TransactionLock) public transactionLocks;
    
    // User mappings for each bus
    mapping(uint256 => mapping(address => uint256[])) public busUserOffers; // busId => user => offers
    mapping(uint256 => mapping(address => uint256[])) public busUserPurchases; // busId => user => purchases
    mapping(address => uint256[]) public userBuses; // user => buses they own
    
    // Concurrent processing
    mapping(bytes32 => bool) public processedTransactions;
    mapping(address => uint256) public userNonce;
    
    // Active offers per bus for quick lookup
    mapping(uint256 => uint256[]) public busActiveOffers;
    mapping(uint256 => mapping(uint256 => uint256)) public offerIndexInBus; // busId => offerId => index

    // Events
    event BusCreated(uint256 indexed busId, string name, address[] owners, uint256 capacity);
    event BusOwnerAdded(uint256 indexed busId, address indexed newOwner);
    event BusCapacityUpdated(uint256 indexed busId, uint256 newCapacity);
    event OfferCreated(uint256 indexed offerId, uint256 indexed busId, address indexed seller, uint256 energyAmount, uint256 pricePerUnit);
    event OfferLocked(uint256 indexed offerId, address indexed buyer, uint256 amount, uint256 lockId);
    event OfferUnlocked(uint256 indexed offerId, uint256 lockId);
    event EnergyPurchased(uint256 indexed purchaseId, uint256 indexed busId, address indexed buyer, address seller, uint256 energyAmount, uint256 totalPrice);
    event PurchaseCompleted(uint256 indexed purchaseId);
    event ConcurrentPurchaseProcessed(bytes32 indexed txHash, address indexed buyer, uint256 offerId);

    // Modifiers
    modifier onlyBusOwner(uint256 _busId) {
        require(_busId > 0 && _busId <= busIdCounter, "Invalid bus ID");
        require(energyBuses[_busId].isOwner[msg.sender], "Not a bus owner");
        _;
    }
    
    modifier validBus(uint256 _busId) {
        require(_busId > 0 && _busId <= busIdCounter, "Invalid bus ID");
        require(energyBuses[_busId].isActive, "Bus not active");
        _;
    }

    // Create a new energy bus with multiple owners
    function createEnergyBus(
        string memory _name,
        address[] memory _owners,
        uint256 _capacity,
        uint256 _basePrice
    ) external returns (uint256) {
        require(_owners.length > 0, "Must have at least one owner");
        require(_capacity > 0, "Capacity must be greater than 0");
        require(_basePrice > 0, "Base price must be greater than 0");
        
        // Verify caller is in owners list
        bool isCallerOwner = false;
        for (uint256 i = 0; i < _owners.length; i++) {
            if (_owners[i] == msg.sender) {
                isCallerOwner = true;
                break;
            }
        }
        require(isCallerOwner, "Caller must be in owners list");
        
        busIdCounter++;
        
        EnergyBus storage newBus = energyBuses[busIdCounter];
        newBus.id = busIdCounter;
        newBus.name = _name;
        newBus.owners = _owners;
        newBus.totalCapacity = _capacity;
        newBus.availableCapacity = _capacity;
        newBus.basePrice = _basePrice;
        newBus.isActive = true;
        newBus.ownerCount = _owners.length;
        
        // Set owner mappings and user buses
        for (uint256 i = 0; i < _owners.length; i++) {
            newBus.isOwner[_owners[i]] = true;
            userBuses[_owners[i]].push(busIdCounter);
        }
        
        emit BusCreated(busIdCounter, _name, _owners, _capacity);
        
        return busIdCounter;
    }
    
    // Add owner to existing bus
    function addBusOwner(uint256 _busId, address _newOwner) external onlyBusOwner(_busId) {
        require(_newOwner != address(0), "Invalid owner address");
        require(!energyBuses[_busId].isOwner[_newOwner], "Already an owner");
        
        energyBuses[_busId].owners.push(_newOwner);
        energyBuses[_busId].isOwner[_newOwner] = true;
        energyBuses[_busId].ownerCount++;
        userBuses[_newOwner].push(_busId);
        
        emit BusOwnerAdded(_busId, _newOwner);
    }
    
    // Create energy offer on specific bus (multiple owners can create simultaneously)
    function createOffer(
        uint256 _busId,
        uint256 _energyAmount,
        uint256 _pricePerUnit
    ) external validBus(_busId) returns (uint256) {
        require(_energyAmount > 0, "Energy amount must be greater than 0");
        require(_pricePerUnit > 0, "Price must be greater than 0");
        require(_energyAmount <= energyBuses[_busId].availableCapacity, "Insufficient bus capacity");
        
        offerIdCounter++;
        
        energyOffers[offerIdCounter] = EnergyOffer({
            id: offerIdCounter,
            busId: _busId,
            seller: msg.sender,
            energyAmount: _energyAmount,
            pricePerUnit: _pricePerUnit,
            isActive: true,
            timestamp: block.timestamp,
            lockExpiry: 0
        });
        
        // Update bus capacity
        energyBuses[_busId].availableCapacity -= _energyAmount;
        
        // Add to user's offers for this bus
        busUserOffers[_busId][msg.sender].push(offerIdCounter);
        
        // Add to bus active offers with index tracking
        busActiveOffers[_busId].push(offerIdCounter);
        offerIndexInBus[_busId][offerIdCounter] = busActiveOffers[_busId].length - 1;
        
        emit OfferCreated(offerIdCounter, _busId, msg.sender, _energyAmount, _pricePerUnit);
        
        return offerIdCounter;
    }
    
    // Purchase energy with concurrent transaction support
    function purchaseEnergy(
        uint256 _offerId,
        uint256 _energyAmount,
        uint256 _nonce
    ) external payable returns (uint256) {
        // Generate unique transaction hash for concurrency control
        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, _offerId, _energyAmount, _nonce, block.timestamp));
        require(!processedTransactions[txHash], "Transaction already processed");
        require(_nonce >= userNonce[msg.sender], "Invalid nonce");
        
        EnergyOffer storage offer = energyOffers[_offerId];
        require(offer.isActive, "Offer not active");
        require(offer.lockExpiry < block.timestamp, "Offer is locked");
        require(_energyAmount > 0 && _energyAmount <= offer.energyAmount, "Invalid energy amount");
        require(msg.sender != offer.seller, "Cannot buy your own energy");
        
        uint256 totalPrice = _energyAmount * offer.pricePerUnit;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Lock the offer for concurrent processing
        lockIdCounter++;
        transactionLocks[lockIdCounter] = TransactionLock({
            offerId: _offerId,
            buyer: msg.sender,
            amount: _energyAmount,
            lockTime: block.timestamp,
            isActive: true
        });
        
        offer.lockExpiry = block.timestamp + LOCK_DURATION;
        
        // Create purchase record
        purchaseIdCounter++;
        energyPurchases[purchaseIdCounter] = EnergyPurchase({
            id: purchaseIdCounter,
            busId: offer.busId,
            offerId: _offerId,
            buyer: msg.sender,
            seller: offer.seller,
            energyAmount: _energyAmount,
            totalPrice: totalPrice,
            timestamp: block.timestamp,
            completed: false,
            transactionHash: txHash
        });
        
        // Update user nonce and mark transaction as processed
        userNonce[msg.sender] = _nonce + 1;
        processedTransactions[txHash] = true;
        
        // Add to user's purchases for this bus
        busUserPurchases[offer.busId][msg.sender].push(purchaseIdCounter);
        
        // Update the offer
        if (_energyAmount == offer.energyAmount) {
            // Remove from active offers
            _removeOfferFromBus(offer.busId, _offerId);
            offer.isActive = false;
        } else {
            offer.energyAmount -= _energyAmount;
        }
        
        // Transfer payment to seller
        payable(offer.seller).transfer(totalPrice);
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        // Unlock the offer
        transactionLocks[lockIdCounter].isActive = false;
        offer.lockExpiry = 0;
        
        emit OfferLocked(_offerId, msg.sender, _energyAmount, lockIdCounter);
        emit EnergyPurchased(purchaseIdCounter, offer.busId, msg.sender, offer.seller, _energyAmount, totalPrice);
        emit ConcurrentPurchaseProcessed(txHash, msg.sender, _offerId);
        emit OfferUnlocked(_offerId, lockIdCounter);
        
        return purchaseIdCounter;
    }
    
    // Batch purchase from multiple offers simultaneously
    function batchPurchaseEnergy(
        uint256[] memory _offerIds,
        uint256[] memory _energyAmounts,
        uint256 _nonce
    ) external payable returns (uint256[] memory) {
        require(_offerIds.length == _energyAmounts.length, "Arrays length mismatch");
        require(_offerIds.length > 0, "No offers specified");
        
        bytes32 txHash = keccak256(abi.encodePacked(msg.sender, _offerIds, _energyAmounts, _nonce, block.timestamp));
        require(!processedTransactions[txHash], "Batch transaction already processed");
        require(_nonce >= userNonce[msg.sender], "Invalid nonce");
        
        uint256[] memory purchaseIds = new uint256[](_offerIds.length);
        uint256 totalRequired = 0;
        
        // Calculate total payment required
        for (uint256 i = 0; i < _offerIds.length; i++) {
            EnergyOffer storage offer = energyOffers[_offerIds[i]];
            require(offer.isActive, "Offer not active");
            require(offer.lockExpiry < block.timestamp, "Offer is locked");
            require(_energyAmounts[i] <= offer.energyAmount, "Insufficient energy in offer");
            totalRequired += _energyAmounts[i] * offer.pricePerUnit;
        }
        
        require(msg.value >= totalRequired, "Insufficient payment for batch purchase");
        
        // Process each purchase
        for (uint256 i = 0; i < _offerIds.length; i++) {
            purchaseIdCounter++;
            EnergyOffer storage offer = energyOffers[_offerIds[i]];
            uint256 purchasePrice = _energyAmounts[i] * offer.pricePerUnit;
            
            energyPurchases[purchaseIdCounter] = EnergyPurchase({
                id: purchaseIdCounter,
                busId: offer.busId,
                offerId: _offerIds[i],
                buyer: msg.sender,
                seller: offer.seller,
                energyAmount: _energyAmounts[i],
                totalPrice: purchasePrice,
                timestamp: block.timestamp,
                completed: false,
                transactionHash: txHash
            });
            
            // Update offer
            if (_energyAmounts[i] == offer.energyAmount) {
                _removeOfferFromBus(offer.busId, _offerIds[i]);
                offer.isActive = false;
            } else {
                offer.energyAmount -= _energyAmounts[i];
            }
            
            // Add to user's purchases
            busUserPurchases[offer.busId][msg.sender].push(purchaseIdCounter);
            
            // Transfer payment to seller
            payable(offer.seller).transfer(purchasePrice);
            
            purchaseIds[i] = purchaseIdCounter;
            
            emit EnergyPurchased(purchaseIdCounter, offer.busId, msg.sender, offer.seller, _energyAmounts[i], purchasePrice);
        }
        
        // Update user nonce and mark transaction as processed
        userNonce[msg.sender] = _nonce + 1;
        processedTransactions[txHash] = true;
        
        // Refund excess payment
        if (msg.value > totalRequired) {
            payable(msg.sender).transfer(msg.value - totalRequired);
        }
        
        emit ConcurrentPurchaseProcessed(txHash, msg.sender, 0);
        
        return purchaseIds;
    }
    
    // Internal function to remove offer from bus active offers array
    function _removeOfferFromBus(uint256 _busId, uint256 _offerId) internal {
        uint256 index = offerIndexInBus[_busId][_offerId];
        uint256 lastIndex = busActiveOffers[_busId].length - 1;
        
        if (index != lastIndex) {
            uint256 lastOfferId = busActiveOffers[_busId][lastIndex];
            busActiveOffers[_busId][index] = lastOfferId;
            offerIndexInBus[_busId][lastOfferId] = index;
        }
        
        busActiveOffers[_busId].pop();
        delete offerIndexInBus[_busId][_offerId];
    }
    
    // Confirm energy transfer completion
    function confirmEnergyTransfer(uint256 _purchaseId) external {
        EnergyPurchase storage purchase = energyPurchases[_purchaseId];
        require(purchase.seller == msg.sender, "Only seller can confirm transfer");
        require(!purchase.completed, "Transfer already completed");
        
        purchase.completed = true;
        
        emit PurchaseCompleted(_purchaseId);
    }
    
    // Get all active offers for a specific bus
    function getBusActiveOffers(uint256 _busId) external view validBus(_busId) returns (uint256[] memory) {
        return busActiveOffers[_busId];
    }
    
    // Get bus details
    function getBusDetails(uint256 _busId) external view returns (
        string memory name,
        address[] memory owners,
        uint256 totalCapacity,
        uint256 availableCapacity,
        uint256 basePrice,
        bool isActive
    ) {
        EnergyBus storage bus = energyBuses[_busId];
        return (bus.name, bus.owners, bus.totalCapacity, bus.availableCapacity, bus.basePrice, bus.isActive);
    }
    
    // Get user's offers for a specific bus
    function getUserBusOffers(uint256 _busId, address _user) external view returns (uint256[] memory) {
        return busUserOffers[_busId][_user];
    }
    
    // Get user's purchases for a specific bus
    function getUserBusPurchases(uint256 _busId, address _user) external view returns (uint256[] memory) {
        return busUserPurchases[_busId][_user];
    }
    
    // Get all buses a user owns
    function getUserBuses(address _user) external view returns (uint256[] memory) {
        return userBuses[_user];
    }
    
    // Get offer details
    function getOfferDetails(uint256 _offerId) external view returns (
        uint256 busId,
        address seller,
        uint256 energyAmount,
        uint256 pricePerUnit,
        bool isActive,
        uint256 lockExpiry
    ) {
        EnergyOffer storage offer = energyOffers[_offerId];
        return (offer.busId, offer.seller, offer.energyAmount, offer.pricePerUnit, offer.isActive, offer.lockExpiry);
    }
    
    // Get purchase details
    function getPurchaseDetails(uint256 _purchaseId) external view returns (
        uint256 busId,
        uint256 offerId,
        address buyer,
        address seller,
        uint256 energyAmount,
        uint256 totalPrice,
        uint256 timestamp,
        bool completed
    ) {
        EnergyPurchase storage purchase = energyPurchases[_purchaseId];
        return (
            purchase.busId,
            purchase.offerId,
            purchase.buyer,
            purchase.seller,
            purchase.energyAmount,
            purchase.totalPrice,
            purchase.timestamp,
            purchase.completed
        );
    }
    
    // Get current bus count
    function getBusCount() external view returns (uint256) {
        return busIdCounter;
    }
    
    // Check if transaction hash was processed (for frontend verification)
    function isTransactionProcessed(bytes32 _txHash) external view returns (bool) {
        return processedTransactions[_txHash];
    }
}
