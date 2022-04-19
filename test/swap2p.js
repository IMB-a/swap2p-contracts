const { expect } = require("chai");

describe("Swap2p", function () {
  before(async function () {
    const accounts = await ethers.getSigners();
    this.deployer = accounts[0];
    this.tokenxholder = accounts[1];
    this.tokenyholder = accounts[2];

    this.Swap2pArtifact = await ethers.getContractFactory("Swap2p");
    this.TokenXArtifact = await ethers.getContractFactory("TokenXMock");
    this.TokenYArtifact = await ethers.getContractFactory("TokenYMock");
  });

  beforeEach(async function () {
    this.swap2p = await this.Swap2pArtifact.deploy();
    this.tokenx = await this.TokenXArtifact.deploy();
    this.tokeny = await this.TokenYArtifact.deploy();
  });

  it("should be deployed", async function () {
    expect(await this.swap2p.deployed(), true);
    expect(await this.tokenx.deployed(), true);
    expect(await this.tokeny.deployed(), true);
  });

  describe("mint tokenx and tokeny", function () {
    beforeEach(async function () {
      await this.tokenx
        .connect(this.deployer)
        .mint(this.tokenxholder.address, 1000);
      await this.tokeny
        .connect(this.deployer)
        .mint(this.tokenyholder.address, 1000);
    });

    describe("approve tokenx createEscrow", function () {
      beforeEach(async function () {
        await this.tokenx
          .connect(this.tokenxholder)
          .approve(this.swap2p.address, 100);
        await this.swap2p
          .connect(this.tokenxholder)
          .createEscrow(
            this.tokenx.address,
            100,
            this.tokeny.address,
            200,
            "0xA3c45c542ceF281842e4956D0f70F398cC9d2798"
          );
      });

      it("tokenxholder and tokenyholder have right balanceOf tokenx and tokeny", async function () {
        expect(await this.tokenx.balanceOf(this.tokenxholder.address), 1000);
        expect(await this.tokenx.balanceOf(this.tokenyholder.address), 0);
        expect(await this.tokeny.balanceOf(this.tokenyholder.address), 1000);
        expect(await this.tokeny.balanceOf(this.tokenxholder.address), 0);
      });

      describe("approve tokeny and acceptEscrow", function () {
        beforeEach(async function () {
          await this.tokeny
            .connect(this.tokenyholder)
            .approve(this.swap2p.address, 200);
          expect(await this.swap2p.connect(this.tokenyholder).acceptEscrow(0));
        });

        it("tokenxholder and tokenyholder have right balanceOf tokenx and tokeny", async function () {
          expect(await this.tokenx.balanceOf(this.tokenxholder.address), 900);
          expect(await this.tokenx.balanceOf(this.tokenyholder.address), 100);
          expect(await this.tokeny.balanceOf(this.tokenyholder.address), 800);
          expect(await this.tokeny.balanceOf(this.tokenxholder.address), 200);
        });
      });
    });
  });
});
