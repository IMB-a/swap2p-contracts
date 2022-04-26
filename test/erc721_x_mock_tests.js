const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("ERC721YMock", function () {
  before(async function () {
    const accounts = await ethers.getSigners();
    this.provider = ethers.getDefaultProvider();
    this.deployer = accounts[0];
    this.other = accounts[1];
    this.grantedAdmin = accounts[2];
    this.ERC721XMockArtifact = await ethers.getContractFactory("ERC721YMock");
  });

  beforeEach(async function () {
    this.erc721 = await this.ERC721XMockArtifact.deploy();
  });


  it("setDefaultUri reverts if called by wrong role", async function () {
    await expect(
      this.erc721
        .connect(this.provider)
        .setDefaultUri("ipfs://ipfs/defaultUri")
    ).to.be.reverted;
  });

  it("tokenURI reverts if requested URI query for nonexistent token", async function () {
    await expect(this.erc721.connect(this.provider).tokenURI(1)).to.be
      .reverted;
  });

  describe("grant admin role", function () {
    beforeEach(async function () {
      await this.erc721.grantRole(
        await this.erc721.DEFAULT_ADMIN_ROLE(),
        this.grantedAdmin.address
      );
    });

    it("tokenURI reverts if requested URI query for nonexistent token", async function () {
      await expect(this.erc721.connect(this.provider).tokenURI(1)).to.be
        .reverted;
    });

    it("totalSupply equal 0", async function () {
      expect(
        await this.erc721.connect(this.grantedAdmin).totalSupply()
      ).to.be.equal(0);
    });

    describe("mint first token", function () {
      beforeEach(async function () {
        await this.erc721.connect(this.grantedAdmin).mint(this.other.address);
      });

      it("zero token has tokenURI '/0.json' after its mint", async function () {
        expect(
          await this.erc721.connect(this.grantedAdmin).tokenURI(0)
        ).to.be.equal("/0.json");
      });

      describe("set default uri", function () {
        beforeEach(async function () {
          await this.erc721.setDefaultUri("URI");
        });

        it("zero token has tokenURI 'URI/0.json' after its mint", async function () {
          expect(
            await this.erc721.connect(this.grantedAdmin).tokenURI(0)
          ).to.be.equal("URI/0.json");
          await expect(
            this.erc721.connect(this.grantedAdmin).tokenURI(1)
          ).to.be.revertedWith("URI query for nonexistent token");
        });
      });
    });
  });

  describe("with granted DEFAULT_ADMIN_ROLE", function () {
    beforeEach(async function () {
      await this.erc721.grantRole(
        await this.erc721.DEFAULT_ADMIN_ROLE(),
        this.grantedAdmin.address
      );
    });

    it("setDefaultUri succeeds and fails after revocation", async function () {
      await this.erc721
        .connect(this.grantedAdmin)
        .setDefaultUri("ipfs://ipfs/newURI");
      await this.erc721.revokeRole(
        await this.erc721.DEFAULT_ADMIN_ROLE(),
        this.grantedAdmin.address
      );
      await expect(
        this.erc721
          .connect(this.grantedAdmin)
          .setDefaultUri("ipfs://ipfs/newestURI")
      ).to.be.reverted;
    });
  });
});