const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnergyTrading", function () {
  let energyTrading;
  let owner;
  let seller;
  let buyer;

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners();
    
    const EnergyTrading = await ethers.getContractFactory("EnergyTrading");
    energyTrading = await EnergyTrading.deploy();
    await energyTrading.waitForDeployment();
  });

  describe("Listing Energy", function () {
    it("Should allow users to list energy for sale", async function () {
      const energyAmount = 100;
      const pricePerKWh = ethers.parseEther("0.1");

      await expect(energyTrading.connect(seller).listEnergy(energyAmount, pricePerKWh))
        .to.emit(energyTrading, "EnergyListed")
        .withArgs(1, seller.address, energyAmount, pricePerKWh, energyAmount * pricePerKWh);

      const listing = await energyTrading.listings(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.energyAmount).to.equal(energyAmount);
      expect(listing.pricePerKWh).to.equal(pricePerKWh);
      expect(listing.isActive).to.be.true;
      expect(listing.isSold).to.be.false;
    });

    it("Should reject listings with zero energy amount", async function () {
      const energyAmount = 0;
      const pricePerKWh = ethers.parseEther("0.1");

      await expect(energyTrading.connect(seller).listEnergy(energyAmount, pricePerKWh))
        .to.be.revertedWith("Energy amount must be greater than 0");
    });

    it("Should reject listings with zero price", async function () {
      const energyAmount = 100;
      const pricePerKWh = 0;

      await expect(energyTrading.connect(seller).listEnergy(energyAmount, pricePerKWh))
        .to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Purchasing Energy", function () {
    beforeEach(async function () {
      // Create a listing first
      const energyAmount = 100;
      const pricePerKWh = ethers.parseEther("0.1");
      await energyTrading.connect(seller).listEnergy(energyAmount, pricePerKWh);
    });

    it("Should allow users to purchase energy", async function () {
      const totalPrice = ethers.parseEther("10"); // 100 * 0.1

      await expect(energyTrading.connect(buyer).purchaseEnergy(1, { value: totalPrice }))
        .to.emit(energyTrading, "EnergyPurchased")
        .withArgs(1, buyer.address, seller.address, 100, totalPrice);

      const listing = await energyTrading.listings(1);
      expect(listing.isSold).to.be.true;
      expect(listing.isActive).to.be.false;

      const buyerBalance = await energyTrading.getUserEnergyBalance(buyer.address);
      expect(buyerBalance).to.equal(100);
    });

    it("Should reject purchases with insufficient payment", async function () {
      const insufficientPayment = ethers.parseEther("5"); // Less than required 10 ETH

      await expect(energyTrading.connect(buyer).purchaseEnergy(1, { value: insufficientPayment }))
        .to.be.revertedWith("Insufficient payment");
    });

    it("Should reject seller buying their own energy", async function () {
      const totalPrice = ethers.parseEther("10");

      await expect(energyTrading.connect(seller).purchaseEnergy(1, { value: totalPrice }))
        .to.be.revertedWith("Cannot buy your own energy");
    });

    it("Should reject purchases of already sold energy", async function () {
      const totalPrice = ethers.parseEther("10");

      // First purchase
      await energyTrading.connect(buyer).purchaseEnergy(1, { value: totalPrice });

      // Second purchase attempt
      await expect(energyTrading.connect(buyer).purchaseEnergy(1, { value: totalPrice }))
        .to.be.revertedWith("Listing already sold");
    });
  });

  describe("Cancelling Listings", function () {
    beforeEach(async function () {
      const energyAmount = 100;
      const pricePerKWh = ethers.parseEther("0.1");
      await energyTrading.connect(seller).listEnergy(energyAmount, pricePerKWh);
    });

    it("Should allow listing owner to cancel listing", async function () {
      await expect(energyTrading.connect(seller).cancelListing(1))
        .to.emit(energyTrading, "ListingCancelled")
        .withArgs(1, seller.address);

      const listing = await energyTrading.listings(1);
      expect(listing.isActive).to.be.false;
    });

    it("Should reject cancellation by non-owner", async function () {
      await expect(energyTrading.connect(buyer).cancelListing(1))
        .to.be.revertedWith("Not the listing owner");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create multiple listings
      await energyTrading.connect(seller).listEnergy(100, ethers.parseEther("0.1"));
      await energyTrading.connect(seller).listEnergy(200, ethers.parseEther("0.2"));
      await energyTrading.connect(buyer).listEnergy(150, ethers.parseEther("0.15"));
    });

    it("Should return active listings", async function () {
      const activeListings = await energyTrading.getActiveListings();
      expect(activeListings.length).to.equal(3);
    });

    it("Should return user listings", async function () {
      const sellerListings = await energyTrading.getUserListings(seller.address);
      expect(sellerListings.length).to.equal(2);
      
      const buyerListings = await energyTrading.getUserListings(buyer.address);
      expect(buyerListings.length).to.equal(1);
    });

    it("Should track energy balances correctly", async function () {
      // Purchase energy
      const totalPrice = ethers.parseEther("10");
      await energyTrading.connect(buyer).purchaseEnergy(1, { value: totalPrice });

      const balance = await energyTrading.getUserEnergyBalance(buyer.address);
      expect(balance).to.equal(100);
    });
  });
});
