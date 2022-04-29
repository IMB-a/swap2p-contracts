const { expect } = require("chai");
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

describe("Escrow721To721", function () {
  before(async function () {
    const accounts = await ethers.getSigners();
    this.deployer = accounts[0];
    this.tokenXHolder = accounts[1];
    this.tokenYHolder = accounts[2];
    this.randomAccount = accounts[3];

    this.Swap2pArtifact = await ethers.getContractFactory("Swap2p");
    this.Escrow721To20Artifact = await ethers.getContractFactory(
      "Escrow721To20"
    );
    this.tokenXArtifact = await ethers.getContractFactory("ERC721XMock");
    this.tokenYArtifact = await ethers.getContractFactory("ERC20YMock");
  });

  beforeEach(async function () {
    this.swap2p = await this.Swap2pArtifact.deploy();
    this.escrow721to20Fee = ethers.BigNumber.from(1);
    this.escrow721to20 = await this.Escrow721To20Artifact.deploy(
      this.swap2p.address,
      this.escrow721to20Fee
    );
    this.tokenX = await this.tokenXArtifact.deploy();
    this.tokenY = await this.tokenYArtifact.deploy();
  });

  it("should be deployed", async function () {
    expect(await this.escrow721to20.deployed());
    expect(await this.tokenX.deployed());
    expect(await this.tokenY.deployed());
  });

  it("revert then no escrows", async function () {
    await expect(this.escrow721to20.getEscrow(0)).to.be.revertedWith(
      "no escrows"
    );
  });

  describe("mint tokenX", function () {
    beforeEach(async function () {
      await this.tokenX.connect(this.deployer).mint(this.tokenXHolder.address);
      await this.tokenX.connect(this.deployer).mint(this.randomAccount.address);
      await this.swap2p
        .connect(this.deployer)
        .mint(this.tokenXHolder.address, this.escrow721to20Fee);
    });

    describe("approve tokenX for escrow721to20", function () {
      beforeEach(async function () {
        this.zeroAddress = ZERO_ADDRESS;
        this.firstXIndex = 0;
        this.firstEscrowTokenYAmount = 100;
        await this.tokenX
          .connect(this.tokenXHolder)
          .approve(this.escrow721to20.address, this.firstXIndex);
        await this.swap2p
          .connect(this.tokenXHolder)
          .approve(this.escrow721to20.address, this.escrow721to20Fee);
      });

      it("revert then createEscrow with zero tokenX address", async function () {
        await expect(
          this.escrow721to20
            .connect(this.tokenXHolder)
            .createEscrow(
              ZERO_ADDRESS,
              this.firstXIndex,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            )
        ).to.be.revertedWith("x zero address");
      });

      it("revert then createEscrow with zero tokenY address", async function () {
        await expect(
          this.escrow721to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstXIndex,
              ZERO_ADDRESS,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            )
        ).to.be.revertedWith("y zero address");
      });

      it("revert then createEscrow with zero tokenY amount", async function () {
        await expect(
          this.escrow721to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstXIndex,
              this.tokenY.address,
              ZERO_ADDRESS,
              this.zeroAddress
            )
        ).to.be.revertedWith("y zero amount");
      });

      it("revert then createEscrow with a tokenX that is not yours", async function () {
        const secondTokenIndex = 1;
        await expect(
          this.escrow721to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              secondTokenIndex,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            )
        ).to.be.revertedWith("you don't have a token");
      });

      describe("change fee", function () {
        beforeEach(async function () {
          this.escrow721to20NewFee = this.escrow721to20Fee.mul(
            ethers.BigNumber.from(2)
          );
          await this.escrow721to20
            .connect(this.deployer)
            .setFee(this.escrow721to20NewFee);
        });

        it("revert then createEscrow with old fee", async function () {
          await expect(
            this.escrow721to20
              .connect(this.tokenXHolder)
              .createEscrow(
                this.tokenX.address,
                this.firstXIndex,
                this.tokenY.address,
                this.firstEscrowTokenYAmount,
                this.zeroAddress
              )
          ).to.be.revertedWith("not enough SP");
        });
      });

      describe("approve tokenX create #0 escrow", function () {
        beforeEach(async function () {
          await this.escrow721to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstXIndex,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress
            );
        });

        it("deployer can claimFee after first createEscrow", async function () {
          await this.escrow721to20
            .connect(this.deployer)
            .claimFee(this.deployer.address);
        });

        it("check escrow #0 exist and open", async function () {
          const escrow = await this.escrow721to20.getEscrow(0);
          expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
          expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
          expect(escrow.xIndex).to.equal(this.firstXIndex);
          expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
          expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
          expect(escrow.yOwner).to.equal(this.zeroAddress);
          expect(escrow.closed).to.equal(false);
        });

        it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
          expect(await this.tokenX.ownerOf(this.firstXIndex)).to.equal(
            this.escrow721to20.address
          );
        });

        it("check non author can't cancel escrow #0", async function () {
          await expect(
            this.escrow721to20.connect(this.randomAccount).cancelEscrow(0)
          ).to.be.revertedWith("you'r isn't escrow owner");
        });

        it("revert then getEscrow index out of range", async function () {
          await expect(this.escrow721to20.getEscrow(1)).to.be.revertedWith(
            "Id must be < escrows length"
          );
        });

        describe("cancel create #0 escrow", function () {
          beforeEach(async function () {
            await this.escrow721to20.connect(this.tokenXHolder).cancelEscrow(0);
          });

          it("check escrow #0 exist and closed", async function () {
            const escrow = await this.escrow721to20.getEscrow(0);
            expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
            expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
            expect(escrow.xIndex).to.equal(this.firstXIndex);
            expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
            expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
            expect(escrow.closed).to.equal(true);
          });

          it("revert then cancel already closed escrow", async function () {
            await expect(
              this.escrow721to20.connect(this.tokenXHolder).cancelEscrow(0)
            ).to.be.revertedWith("escrow already closed");
          });
        });

        describe("mint first tokenY", function () {
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
                .approve(
                  this.escrow721to20.address,
                  this.firstEscrowTokenYAmount
                );
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
                .transfer(toRandomAddress, allOwnedYTokens);
              await expect(
                this.escrow721to20.connect(this.tokenYHolder).acceptEscrow(0)
              ).to.be.revertedWith("not enough yToken");
            });

            describe("acceptEscrow #0", function () {
              beforeEach(async function () {
                expect(
                  await this.escrow721to20
                    .connect(this.tokenYHolder)
                    .acceptEscrow(0)
                );
              });

              it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
                expect(await this.tokenX.ownerOf(this.firstXIndex)).to.equal(
                  this.tokenYHolder.address
                );
                expect(
                  await this.tokenY.balanceOf(this.tokenXHolder.address)
                ).to.equal(this.firstEscrowTokenYAmount);
              });

              it("check escrow #0 exist and closed", async function () {
                const escrow = await this.escrow721to20.getEscrow(0);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xIndex).to.equal(this.firstXIndex);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
                expect(escrow.yOwner).to.equal(this.zeroAddress);
                expect(escrow.closed).to.equal(true);
              });

              it("revert then trying accept closed escrow", async function () {
                await expect(
                  this.escrow721to20.connect(this.tokenYHolder).acceptEscrow(0)
                ).to.be.revertedWith("escrow closed");
              });
            });

            describe("approve tokenX create #1 escrow", function () {
              beforeEach(async function () {
                this.thirdIndex = 2;
                this.zeroAddress = ZERO_ADDRESS;

                await this.tokenX
                  .connect(this.deployer)
                  .mint(this.tokenXHolder.address);
                await this.tokenX
                  .connect(this.tokenXHolder)
                  .approve(this.escrow721to20.address, this.thirdIndex);
                await this.swap2p
                  .connect(this.deployer)
                  .mint(this.tokenXHolder.address, this.escrow721to20Fee);
                await this.swap2p
                  .connect(this.tokenXHolder)
                  .approve(this.escrow721to20.address, this.escrow721to20Fee);
                await this.escrow721to20
                  .connect(this.tokenXHolder)
                  .createEscrow(
                    this.tokenX.address,
                    this.thirdIndex,
                    this.tokenY.address,
                    this.firstEscrowTokenYAmount,
                    this.zeroAddress
                  );
              });

              it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
                await this.tokenY
                  .connect(this.tokenYHolder)
                  .approve(
                    this.escrow721to20.address,
                    this.firstEscrowTokenYAmount
                  );
                expect(
                  await this.escrow721to20
                    .connect(this.tokenYHolder)
                    .acceptEscrow(0)
                );
              });

              it("check escrow #1 exist and open", async function () {
                const escrow = await this.escrow721to20.getEscrow(0);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xIndex).to.equal(this.firstXIndex);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
                expect(escrow.yOwner).to.equal(this.zeroAddress);
                expect(escrow.closed).to.equal(false);
              });
            });

            describe("approve tokenX create #1 escrow with random yOwner address", function () {
              beforeEach(async function () {
                this.thirdIndex = 2;
                await this.tokenX
                  .connect(this.deployer)
                  .mint(this.tokenXHolder.address);
                await this.tokenX
                  .connect(this.tokenXHolder)
                  .approve(this.escrow721to20.address, this.thirdIndex);
                await this.swap2p
                  .connect(this.deployer)
                  .mint(this.tokenXHolder.address, this.escrow721to20Fee);
                await this.swap2p
                  .connect(this.tokenXHolder)
                  .approve(this.escrow721to20.address, this.escrow721to20Fee);
                await this.escrow721to20
                  .connect(this.tokenXHolder)
                  .createEscrow(
                    this.tokenX.address,
                    this.thirdIndex,
                    this.tokenY.address,
                    this.firstEscrowTokenYAmount,
                    this.randomAccount.address
                  );
              });

              it("check escrow #1 exist and open", async function () {
                const escrow = await this.escrow721to20.getEscrow(0);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xIndex).to.equal(this.firstXIndex);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
                expect(escrow.yOwner).to.equal(this.zeroAddress);
                expect(escrow.closed).to.equal(false);
              });

              it("revert then yOwner trying to accept escrow not for itself", async function () {
                await this.tokenY
                  .connect(this.tokenYHolder)
                  .approve(
                    this.escrow721to20.address,
                    this.firstEscrowTokenYAmount
                  );
                await expect(
                  this.escrow721to20.connect(this.tokenYHolder).acceptEscrow(1)
                ).to.be.revertedWith("escrow not for you");
              });
            });
          });
        });
      });
    });
  });
});
