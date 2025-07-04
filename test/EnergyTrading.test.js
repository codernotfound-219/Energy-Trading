const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiBusEnergyTrading", function () {
  let multiBusEnergyTrading;
  let owner;
  let owner2;
  let seller;
  let buyer;
  let buyer2;

  beforeEach(async function () {
    [owner, owner2, seller, buyer, buyer2] = await ethers.getSigners();
    
    const MultiBusEnergyTrading = await ethers.getContractFactory("MultiBusEnergyTrading");
    multiBusEnergyTrading = await MultiBusEnergyTrading.deploy();
    await multiBusEnergyTrading.waitForDeployment();
  });

  describe("Bus Management", function () {
    it("Should allow creating a new energy bus", async function () {
      const busName = "Solar Farm A";
      const owners = [owner.address, owner2.address];
      const capacity = 1000; // 1000 Wh
      const basePrice = ethers.parseEther("0.001"); // 0.001 ETH per Wh

      await expect(multiBusEnergyTrading.connect(owner).createEnergyBus(
        busName, owners, capacity, basePrice
      ))
        .to.emit(multiBusEnergyTrading, "BusCreated")
        .withArgs(1, busName, owners, capacity);

      const busDetails = await multiBusEnergyTrading.getBusDetails(1);
      expect(busDetails.name).to.equal(busName);
      expect(busDetails.totalCapacity).to.equal(capacity);
      expect(busDetails.availableCapacity).to.equal(capacity);
      expect(busDetails.basePrice).to.equal(basePrice);
      expect(busDetails.isActive).to.be.true;
    });

    it("Should reject bus creation with invalid parameters", async function () {
      const busName = "Invalid Bus";
      const owners = [];
      const capacity = 1000;
      const basePrice = ethers.parseEther("0.001");

      await expect(multiBusEnergyTrading.connect(owner).createEnergyBus(
        busName, owners, capacity, basePrice
      )).to.be.revertedWith("Must have at least one owner");
    });

    it("Should allow adding new owners to existing bus", async function () {
      // Create bus first
      const busName = "Solar Farm B";
      const owners = [owner.address];
      const capacity = 1000;
      const basePrice = ethers.parseEther("0.001");

      await multiBusEnergyTrading.connect(owner).createEnergyBus(
        busName, owners, capacity, basePrice
      );

      // Add new owner
      await expect(multiBusEnergyTrading.connect(owner).addBusOwner(1, owner2.address))
        .to.emit(multiBusEnergyTrading, "BusOwnerAdded")
        .withArgs(1, owner2.address);

      const userBuses = await multiBusEnergyTrading.getUserBuses(owner2.address);
      expect(userBuses.length).to.equal(1);
      expect(userBuses[0]).to.equal(1);
    });
  });

  describe("Energy Offers", function () {
    beforeEach(async function () {
      // Create a bus first
      const busName = "Test Bus";
      const owners = [owner.address];
      const capacity = 1000;
      const basePrice = ethers.parseEther("0.001");
      await multiBusEnergyTrading.connect(owner).createEnergyBus(
        busName, owners, capacity, basePrice
      );
    });

    it("Should allow creating energy offers", async function () {
      const busId = 1;
      const energyAmount = 100;
      const pricePerUnit = ethers.parseEther("0.002");

      await expect(multiBusEnergyTrading.connect(seller).createOffer(
        busId, energyAmount, pricePerUnit
      ))
        .to.emit(multiBusEnergyTrading, "OfferCreated")
        .withArgs(1, busId, seller.address, energyAmount, pricePerUnit);

      const offerDetails = await multiBusEnergyTrading.getOfferDetails(1);
      expect(offerDetails.busId).to.equal(busId);
      expect(offerDetails.seller).to.equal(seller.address);
      expect(offerDetails.energyAmount).to.equal(energyAmount);
      expect(offerDetails.pricePerUnit).to.equal(pricePerUnit);
      expect(offerDetails.isActive).to.be.true;
    });

    it("Should reject offers exceeding bus capacity", async function () {
      const busId = 1;
      const energyAmount = 1500; // Exceeds bus capacity of 1000
      const pricePerUnit = ethers.parseEther("0.002");

      await expect(multiBusEnergyTrading.connect(seller).createOffer(
        busId, energyAmount, pricePerUnit
      )).to.be.revertedWith("Insufficient bus capacity");
    });

    it("Should update bus available capacity when offer is created", async function () {
      const busId = 1;
      const energyAmount = 100;
      const pricePerUnit = ethers.parseEther("0.002");

      await multiBusEnergyTrading.connect(seller).createOffer(
        busId, energyAmount, pricePerUnit
      );

      const busDetails = await multiBusEnergyTrading.getBusDetails(1);
      expect(busDetails.availableCapacity).to.equal(900); // 1000 - 100
    });
  });

  describe("Energy Purchases", function () {
    beforeEach(async function () {
      // Create a bus
      const busName = "Test Bus";
      const owners = [owner.address];
      const capacity = 1000;
      const basePrice = ethers.parseEther("0.001");
      await multiBusEnergyTrading.connect(owner).createEnergyBus(
        busName, owners, capacity, basePrice
      );

      // Create an offer
      const busId = 1;
      const energyAmount = 100;
      const pricePerUnit = ethers.parseEther("0.002");
      await multiBusEnergyTrading.connect(seller).createOffer(
        busId, energyAmount, pricePerUnit
      );
    });

    it("Should allow purchasing energy with nonce", async function () {
      const offerId = 1;
      const energyAmount = 50;
      const nonce = 0;
      const totalPrice = ethers.parseEther("0.1"); // 50 * 0.002

      await expect(multiBusEnergyTrading.connect(buyer).purchaseEnergy(
        offerId, energyAmount, nonce, { value: totalPrice }
      ))
        .to.emit(multiBusEnergyTrading, "EnergyPurchased");

      const purchaseDetails = await multiBusEnergyTrading.getPurchaseDetails(1);
      expect(purchaseDetails.buyer).to.equal(buyer.address);
      expect(purchaseDetails.seller).to.equal(seller.address);
      expect(purchaseDetails.energyAmount).to.equal(energyAmount);
      expect(purchaseDetails.totalPrice).to.equal(totalPrice);
    });

    it("Should reject duplicate transactions", async function () {
      const offerId = 1;
      const energyAmount = 50;
      const nonce = 0;
      const totalPrice = ethers.parseEther("0.1");

      // First purchase
      await multiBusEnergyTrading.connect(buyer).purchaseEnergy(
        offerId, energyAmount, nonce, { value: totalPrice }
      );

      // Attempt duplicate purchase with same nonce
      await expect(multiBusEnergyTrading.connect(buyer).purchaseEnergy(
        offerId, energyAmount, nonce, { value: totalPrice }
      )).to.be.revertedWith("Invalid nonce");
    });

    it("Should handle batch purchases", async function () {
      // Create additional offers
      await multiBusEnergyTrading.connect(seller).createOffer(1, 50, ethers.parseEther("0.003"));
      await multiBusEnergyTrading.connect(seller).createOffer(1, 75, ethers.parseEther("0.004"));

      const offerIds = [1, 2, 3];
      const energyAmounts = [25, 30, 40];
      const nonce = 0;
      const totalPrice = ethers.parseEther("0.46"); // 25*0.002 + 30*0.003 + 40*0.004

      const tx = await multiBusEnergyTrading.connect(buyer).batchPurchaseEnergy(
        offerIds, energyAmounts, nonce, { value: totalPrice }
      );
      
      const receipt = await tx.wait();

      // Verify all purchases were created by checking events
      const purchaseEvents = receipt.logs.filter(log => {
        try {
          const parsed = multiBusEnergyTrading.interface.parseLog(log);
          return parsed.name === "EnergyPurchased";
        } catch {
          return false;
        }
      });
      
      expect(purchaseEvents.length).to.equal(3);
    });
  });

  describe("Transaction Locks", function () {
    beforeEach(async function () {
      // Create a bus and offer
      const busName = "Test Bus";
      const owners = [owner.address];
      const capacity = 1000;
      const basePrice = ethers.parseEther("0.001");
      await multiBusEnergyTrading.connect(owner).createEnergyBus(
        busName, owners, capacity, basePrice
      );

      const busId = 1;
      const energyAmount = 100;
      const pricePerUnit = ethers.parseEther("0.002");
      await multiBusEnergyTrading.connect(seller).createOffer(
        busId, energyAmount, pricePerUnit
      );
    });

    it("Should process concurrent transactions correctly", async function () {
      const offerId = 1;
      const energyAmount1 = 30;
      const energyAmount2 = 40;
      const nonce1 = 0;
      const nonce2 = 0;
      const totalPrice1 = ethers.parseEther("0.06"); // 30 * 0.002
      const totalPrice2 = ethers.parseEther("0.08"); // 40 * 0.002

      // Both purchases should succeed with different nonces
      await multiBusEnergyTrading.connect(buyer).purchaseEnergy(
        offerId, energyAmount1, nonce1, { value: totalPrice1 }
      );

      await multiBusEnergyTrading.connect(buyer2).purchaseEnergy(
        offerId, energyAmount2, nonce2, { value: totalPrice2 }
      );

      // Check that offer was updated correctly
      const offerDetails = await multiBusEnergyTrading.getOfferDetails(offerId);
      expect(offerDetails.energyAmount).to.equal(30); // 100 - 30 - 40
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create multiple buses and offers
      await multiBusEnergyTrading.connect(owner).createEnergyBus(
        "Solar Farm A", [owner.address], 1000, ethers.parseEther("0.001")
      );
      await multiBusEnergyTrading.connect(owner).createEnergyBus(
        "Wind Farm B", [owner.address], 1500, ethers.parseEther("0.002")
      );

      await multiBusEnergyTrading.connect(seller).createOffer(1, 100, ethers.parseEther("0.002"));
      await multiBusEnergyTrading.connect(seller).createOffer(2, 200, ethers.parseEther("0.003"));
    });

    it("Should return correct bus count", async function () {
      const busCount = await multiBusEnergyTrading.getBusCount();
      expect(busCount).to.equal(2);
    });

    it("Should return active offers for a bus", async function () {
      const activeOffers = await multiBusEnergyTrading.getBusActiveOffers(1);
      expect(activeOffers.length).to.equal(1);
      expect(activeOffers[0]).to.equal(1);
    });

    it("Should return user's buses", async function () {
      const userBuses = await multiBusEnergyTrading.getUserBuses(owner.address);
      expect(userBuses.length).to.equal(2);
      expect(userBuses[0]).to.equal(1);
      expect(userBuses[1]).to.equal(2);
    });

    it("Should return user's offers for a specific bus", async function () {
      const userOffers = await multiBusEnergyTrading.getUserBusOffers(1, seller.address);
      expect(userOffers.length).to.equal(1);
      expect(userOffers[0]).to.equal(1);
    });
  });

  describe("Energy Transfer Confirmation", function () {
    beforeEach(async function () {
      // Create bus, offer, and purchase
      await multiBusEnergyTrading.connect(owner).createEnergyBus(
        "Test Bus", [owner.address], 1000, ethers.parseEther("0.001")
      );
      await multiBusEnergyTrading.connect(seller).createOffer(1, 100, ethers.parseEther("0.002"));
      await multiBusEnergyTrading.connect(buyer).purchaseEnergy(
        1, 50, 0, { value: ethers.parseEther("0.1") }
      );
    });

    it("Should allow seller to confirm energy transfer", async function () {
      await expect(multiBusEnergyTrading.connect(seller).confirmEnergyTransfer(1))
        .to.emit(multiBusEnergyTrading, "PurchaseCompleted")
        .withArgs(1);

      const purchaseDetails = await multiBusEnergyTrading.getPurchaseDetails(1);
      expect(purchaseDetails.completed).to.be.true;
    });

    it("Should reject confirmation by non-seller", async function () {
      await expect(multiBusEnergyTrading.connect(buyer).confirmEnergyTransfer(1))
        .to.be.revertedWith("Only seller can confirm transfer");
    });
  });
});
