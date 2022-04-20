const { expect } = require("chai");
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

describe("Swap2p", function () {
  before(async function () {
    const accounts = await ethers.getSigners();
    this.deployer = accounts[0];
    this.tokenXHolder = accounts[1];
    this.tokenYHolder = accounts[2];
    this.randomAccount = accounts[3];

    this.Swap2pArtifact = await ethers.getContractFactory("Swap2p");
    this.tokenXArtifact = await ethers.getContractFactory("TokenXMock");
    this.tokenYArtifact = await ethers.getContractFactory("TokenYMock");
  });

  beforeEach(async function () {
    this.swap2p = await this.Swap2pArtifact.deploy();
    this.tokenX = await this.tokenXArtifact.deploy();
    this.tokenY = await this.tokenYArtifact.deploy();
  });

  it("should be deployed", async function () {
    expect(await this.swap2p.deployed(), true);
    expect(await this.tokenX.deployed(), true);
    expect(await this.tokenY.deployed(), true);
  });

  it("revert then no escrows", async function () {
    await expect(this.swap2p.getEscrow(0)).to.be.revertedWith("no escrows");
  });

  describe("mint tokenX", function () {
    beforeEach(async function () {
      this.mintedXTokens = 1000;
      await this.tokenX
        .connect(this.deployer)
        .mint(this.tokenXHolder.address, this.mintedXTokens);
    });

    describe("approve tokenX for swap2p", function () {
      beforeEach(async function () {
        this.firstEscrowTokenXAmount = 100;
        this.firstEscrowTokenYAmount = 200;
        this.zeroAddress = ZERO_ADDRESS;
        await this.tokenX
          .connect(this.tokenXHolder)
          .approve(this.swap2p.address, this.firstEscrowTokenXAmount);
      });

      it("revert then createEscrow with zero tokenX address", async function () {
        await expect(
          this.swap2p
            .connect(this.tokenXHolder)
            .createEscrow(
              ZERO_ADDRESS,
              this.firstEscrowTokenXAmount,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            )
        ).to.be.revertedWith("x zero address");
      });

      it("revert then createEscrow with zero tokenY address", async function () {
        await expect(
          this.swap2p
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstEscrowTokenXAmount,
              ZERO_ADDRESS,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            )
        ).to.be.revertedWith("y zero address");
      });

      it("revert then createEscrow with zero tokenY address", async function () {
        await expect(
          this.swap2p
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstEscrowTokenXAmount,
              ZERO_ADDRESS,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            )
        ).to.be.revertedWith("y zero address");
      });

      it("revert then createEscrow with zero tokenX amount", async function () {
        await expect(
          this.swap2p
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              ZERO_ADDRESS,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            )
        ).to.be.revertedWith("x zero amount");
      });

      it("revert then createEscrow with zero tokenY amount", async function () {
        await expect(
          this.swap2p
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstEscrowTokenXAmount,
              this.tokenY.address,
              ZERO_ADDRESS,
              this.zeroAddress
            )
        ).to.be.revertedWith("y zero amount");
      });

      it("revert then createEscrow with not enough tokenX", async function () {
        const notEnoughTokenXAmount = 9999999999999;
        await expect(
          this.swap2p
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              notEnoughTokenXAmount,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            )
        ).to.be.revertedWith("not enought xToken");
      });

      describe("approve tokenX create #0 escrow", function () {
        beforeEach(async function () {
          await this.swap2p
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstEscrowTokenXAmount,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            );
        });

        it("check escrow #0 exist and open", async function () {
          const escrow = await this.swap2p.getEscrow(0);
          expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
          expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
          expect(escrow.xAmount).to.equal(this.firstEscrowTokenXAmount);
          expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
          expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
          expect(escrow.closed).to.equal(false);
        });

        it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
          expect(
            await this.tokenX.balanceOf(this.tokenXHolder.address),
            this.mintedXTokens
          );
          expect(await this.tokenX.balanceOf(this.tokenYHolder.address), 0);
          expect(
            await this.tokenY.balanceOf(this.tokenYHolder.address),
            this.mintedYTokens
          );
          expect(await this.tokenY.balanceOf(this.tokenXHolder.address), 0);
        });

        it("check non author can't cancel escrow #0", async function () {
          await expect(
            this.swap2p.connect(this.randomAccount).cancelEscrow(0)
          ).to.be.revertedWith("you'r isn't escrow owner");
        });

        it("revert then getEscrow index out of range", async function () {
          await expect(this.swap2p.getEscrow(1)).to.be.revertedWith(
            "Id must be < escrows length"
          );
        });

        describe("cancel create #0 escrow", function () {
          beforeEach(async function () {
            await this.swap2p.connect(this.tokenXHolder).cancelEscrow(0);
          });

          it("check escrow #0 exist and closed", async function () {
            const escrow = await this.swap2p.getEscrow(0);
            expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
            expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
            expect(escrow.xAmount).to.equal(this.firstEscrowTokenXAmount);
            expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
            expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
            expect(escrow.yOwner).to.equal(this.zeroAddress);
            expect(escrow.closed).to.equal(true);
          });

          it("revert then cancel already closed escrow", async function () {
            await expect(
              this.swap2p.connect(this.tokenXHolder).cancelEscrow(0)
            ).to.be.revertedWith("escrow already closed");
          });
        });

        describe("mint tokenY", function () {
          beforeEach(async function () {
            this.mintedYTokens = 1000;
            await this.tokenY
              .connect(this.deployer)
              .mint(this.tokenYHolder.address, this.mintedYTokens);
          });

          describe("approve tokenY", function () {
            beforeEach(async function () {
              await this.tokenY
                .connect(this.tokenYHolder)
                .approve(this.swap2p.address, this.firstEscrowTokenYAmount);
            });

            it("revert then accept escrow with not enough tokenY", async function () {
              const toRandomAddress =
                "0x0000000000000000000000000000000000000001";
              const allOwnedYTokens =
                this.mintedYTokens - this.firstEscrowTokenYAmount;
              await this.tokenY
                .connect(this.tokenYHolder)
                .approve(toRandomAddress, allOwnedYTokens);
              await this.tokenY
                .connect(this.tokenYHolder)
                .transfer(
                  toRandomAddress,
                  allOwnedYTokens
                );

              await expect(
                this.swap2p.connect(this.tokenYHolder).acceptEscrow(0)
              ).to.be.revertedWith("not enought yToken");
            });

            describe("acceptEscrow #0", function () {
              beforeEach(async function () {
                expect(
                  await this.swap2p.connect(this.tokenYHolder).acceptEscrow(0)
                );
              });

              it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
                expect(
                  await this.tokenX.balanceOf(this.tokenXHolder.address),
                  this.mintedXTokens - this.firstEscrowTokenXAmount
                );
                expect(
                  await this.tokenX.balanceOf(this.tokenYHolder.address),
                  this.firstEscrowTokenXAmount
                );
                expect(
                  await this.tokenY.balanceOf(this.tokenYHolder.address),
                  this.mintedYTokens - this.firstEscrowTokenYAmount
                );
                expect(
                  await this.tokenY.balanceOf(this.tokenXHolder.address),
                  this.firstEscrowTokenYAmount
                );
              });

              it("check escrow #0 exist and closed", async function () {
                const escrow = await this.swap2p.getEscrow(0);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xAmount).to.equal(this.firstEscrowTokenXAmount);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
                expect(escrow.yOwner).to.equal(this.zeroAddress);
                expect(escrow.closed).to.equal(true);
              });

              it("revert then trying accept closed escrow", async function () {
                await expect(
                  this.swap2p.connect(this.tokenYHolder).acceptEscrow(0)
                ).to.be.revertedWith("escrow closed");
              });
            });

            describe("approve tokenX create #1 escrow", function () {
              beforeEach(async function () {
                this.secondEscrowTokenXAmount = 200;
                this.secondEscrowTokenYAmount = 100;
                this.zeroAddress = ZERO_ADDRESS;
                await this.tokenX
                  .connect(this.tokenXHolder)
                  .approve(this.swap2p.address, this.secondEscrowTokenXAmount);
                await this.swap2p
                  .connect(this.tokenXHolder)
                  .createEscrow(
                    this.tokenX.address,
                    this.secondEscrowTokenXAmount,
                    this.tokenY.address,
                    this.secondEscrowTokenYAmount,
                    this.zeroAddress
                  );
              });

              it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
                await this.tokenY
                  .connect(this.tokenYHolder)
                  .approve(this.swap2p.address, this.firstEscrowTokenYAmount);
                expect(
                  await this.swap2p.connect(this.tokenYHolder).acceptEscrow(0)
                );
              });

              it("check escrow #1 exist and open", async function () {
                const escrow = await this.swap2p.getEscrow(1);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xAmount).to.equal(this.secondEscrowTokenXAmount);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yAmount).to.equal(this.secondEscrowTokenYAmount);
                expect(escrow.yOwner).to.equal(this.zeroAddress);
                expect(escrow.closed).to.equal(false);
              });
            });

            describe("approve tokenX create #1 escrow with random yOwner address", function () {
              beforeEach(async function () {
                this.secondEscrowTokenXAmount = 200;
                this.secondEscrowTokenYAmount = 100;
                await this.tokenX
                  .connect(this.tokenXHolder)
                  .approve(this.swap2p.address, this.secondEscrowTokenXAmount);
                await this.swap2p
                  .connect(this.tokenXHolder)
                  .createEscrow(
                    this.tokenX.address,
                    this.secondEscrowTokenXAmount,
                    this.tokenY.address,
                    this.secondEscrowTokenYAmount,
                    this.randomAccount.address
                  );
              });

              it("check escrow #1 exist and open", async function () {
                const escrow = await this.swap2p.getEscrow(1);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xAmount).to.equal(this.secondEscrowTokenXAmount);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yAmount).to.equal(this.secondEscrowTokenYAmount);
                expect(escrow.yOwner).to.equal(this.randomAccount.address);
                expect(escrow.closed).to.equal(false);
              });

              it("revert then yOwner trying to accept escrow not for itself", async function () {
                await this.tokenY
                  .connect(this.tokenYHolder)
                  .approve(this.swap2p.address, this.firstEscrowTokenYAmount);
                await expect(
                  this.swap2p.connect(this.tokenYHolder).acceptEscrow(1)
                ).to.be.revertedWith("escrow not for you");
              });
            });
          });
        });
      });
    });
  });
});
