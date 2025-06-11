// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EnergyTrading {
    struct EnergyListing {
        uint256 id;
        address seller;
        uint256 energyAmount; // in kWh
        uint256 pricePerKWh; // in wei
        uint256 totalPrice;
        bool isActive;
        bool isSold;
        uint256 timestamp;
    }

    struct Purchase {
        uint256 listingId;
        address buyer;
        address seller;
        uint256 energyAmount;
        uint256 totalPrice;
        uint256 timestamp;
    }

    mapping(uint256 => EnergyListing) public listings;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userPurchases;
    mapping(address => uint256) public energyBalance;
    
    uint256 public nextListingId = 1;
    uint256 public totalListings = 0;
    
    Purchase[] public purchases;

    event EnergyListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 energyAmount,
        uint256 pricePerKWh,
        uint256 totalPrice
    );

    event EnergyPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 energyAmount,
        uint256 totalPrice
    );

    event ListingCancelled(uint256 indexed listingId, address indexed seller);

    modifier onlyActiveListing(uint256 _listingId) {
        require(listings[_listingId].isActive, "Listing is not active");
        require(!listings[_listingId].isSold, "Listing already sold");
        _;
    }

    modifier onlyListingOwner(uint256 _listingId) {
        require(listings[_listingId].seller == msg.sender, "Not the listing owner");
        _;
    }

    // List energy for sale
    function listEnergy(uint256 _energyAmount, uint256 _pricePerKWh) external {
        require(_energyAmount > 0, "Energy amount must be greater than 0");
        require(_pricePerKWh > 0, "Price must be greater than 0");

        uint256 totalPrice = _energyAmount * _pricePerKWh;
        
        listings[nextListingId] = EnergyListing({
            id: nextListingId,
            seller: msg.sender,
            energyAmount: _energyAmount,
            pricePerKWh: _pricePerKWh,
            totalPrice: totalPrice,
            isActive: true,
            isSold: false,
            timestamp: block.timestamp
        });

        userListings[msg.sender].push(nextListingId);
        totalListings++;

        emit EnergyListed(nextListingId, msg.sender, _energyAmount, _pricePerKWh, totalPrice);
        nextListingId++;
    }

    // Purchase energy
    function purchaseEnergy(uint256 _listingId) external payable onlyActiveListing(_listingId) {
        EnergyListing storage listing = listings[_listingId];
        require(msg.sender != listing.seller, "Cannot buy your own energy");
        require(msg.value >= listing.totalPrice, "Insufficient payment");

        // Mark listing as sold
        listing.isSold = true;
        listing.isActive = false;

        // Transfer payment to seller
        payable(listing.seller).transfer(listing.totalPrice);

        // Refund excess payment
        if (msg.value > listing.totalPrice) {
            payable(msg.sender).transfer(msg.value - listing.totalPrice);
        }

        // Update energy balances
        energyBalance[msg.sender] += listing.energyAmount;

        // Record purchase
        purchases.push(Purchase({
            listingId: _listingId,
            buyer: msg.sender,
            seller: listing.seller,
            energyAmount: listing.energyAmount,
            totalPrice: listing.totalPrice,
            timestamp: block.timestamp
        }));

        userPurchases[msg.sender].push(purchases.length - 1);

        emit EnergyPurchased(_listingId, msg.sender, listing.seller, listing.energyAmount, listing.totalPrice);
    }

    // Cancel a listing
    function cancelListing(uint256 _listingId) external onlyListingOwner(_listingId) onlyActiveListing(_listingId) {
        listings[_listingId].isActive = false;
        emit ListingCancelled(_listingId, msg.sender);
    }

    // Get all active listings
    function getActiveListings() external view returns (EnergyListing[] memory) {
        uint256 activeCount = 0;
        
        // Count active listings
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].isActive && !listings[i].isSold) {
                activeCount++;
            }
        }

        // Create array of active listings
        EnergyListing[] memory activeListings = new EnergyListing[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].isActive && !listings[i].isSold) {
                activeListings[index] = listings[i];
                index++;
            }
        }

        return activeListings;
    }

    // Get user's listings
    function getUserListings(address _user) external view returns (uint256[] memory) {
        return userListings[_user];
    }

    // Get user's purchases
    function getUserPurchases(address _user) external view returns (uint256[] memory) {
        return userPurchases[_user];
    }

    // Get purchase details
    function getPurchase(uint256 _purchaseIndex) external view returns (Purchase memory) {
        require(_purchaseIndex < purchases.length, "Purchase does not exist");
        return purchases[_purchaseIndex];
    }

    // Get user's energy balance
    function getUserEnergyBalance(address _user) external view returns (uint256) {
        return energyBalance[_user];
    }

    // Get total number of purchases
    function getTotalPurchases() external view returns (uint256) {
        return purchases.length;
    }
}
