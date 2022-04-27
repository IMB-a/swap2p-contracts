const { expect } = require("chai");
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

describe("Escrow20To20", function () {
  before(async function () {
    const accounts = await ethers.getSigners();
    this.deployer = accounts[0];
    this.tokenXHolder = accounts[1];
    this.tokenYHolder = accounts[2];
    this.randomAccount = accounts[3];

    this.Escrow20To20Artifact = await ethers.getContractFactory("Escrow20To20");
    this.tokenXArtifact = await ethers.getContractFactory("ERC20XMock");
    this.tokenYArtifact = await ethers.getContractFactory("ERC20YMock");
  });

  beforeEach(async function () {
    this.escrow20to20Fee = ethers.BigNumber.from(1);
    this.escrow20to20 = await this.Escrow20To20Artifact.deploy(
      this.escrow20to20Fee
    );
    this.tokenX = await this.tokenXArtifact.deploy();
    this.tokenY = await this.tokenYArtifact.deploy();
  });

  it("should be deployed", async function () {
    expect(await this.escrow20to20.deployed());
    expect(await this.tokenX.deployed());
    expect(await this.tokenY.deployed());
  });

  it("revert then no escrows", async function () {
    await expect(this.escrow20to20.getEscrow(0)).to.be.revertedWith(
      "no escrows"
    );
  });

  describe("mint tokenX", function () {
    beforeEach(async function () {
      this.mintedXTokens = 1000;
      await this.tokenX
        .connect(this.deployer)
        .mint(this.tokenXHolder.address, this.mintedXTokens);
    });

    describe("approve tokenX for escrow20to20", function () {
      beforeEach(async function () {
        this.firstEscrowTokenXAmount = 100;
        this.firstEscrowTokenYAmount = 200;
        this.zeroAddress = ZERO_ADDRESS;
        await this.tokenX
          .connect(this.tokenXHolder)
          .approve(this.escrow20to20.address, this.firstEscrowTokenXAmount);
      });

      describe("change fee", function () {
        beforeEach(async function () {
          this.escrow20to20NewFee = this.escrow20to20Fee.mul(
            ethers.BigNumber.from(2)
          );
          await this.escrow20to20
            .connect(this.deployer)
            .setFee(this.escrow20to20NewFee);
        });

        it("revert then createEscrow with old fee", async function () {
          await expect(
            this.escrow20to20
              .connect(this.tokenXHolder)
              .createEscrow(
                this.tokenX.address,
                this.firstEscrowTokenXAmount,
                this.tokenY.address,
                this.firstEscrowTokenYAmount,
                this.zeroAddress,
                {
                  value: this.escrow20to20Fee,
                }
              )
          ).to.be.revertedWith("not enough fee");
        });

        it("ok then createEscrow with new fee", async function () {
          await this.escrow20to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstEscrowTokenXAmount,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress,
              {
                value: this.escrow20to20NewFee,
              }
            );
        });
      });

      it("revert then createEscrow with not enough fee", async function () {
        await expect(
          this.escrow20to20
            .connect(this.tokenXHolder)
            .createEscrow(
              ZERO_ADDRESS,
              this.firstEscrowTokenXAmount,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress,
              {
                value: this.escrow20to20Fee - 1,
              }
            )
        ).to.be.revertedWith("not enough fee");
      });

      it("revert then createEscrow with zero tokenX address", async function () {
        await expect(
          this.escrow20to20
            .connect(this.tokenXHolder)
            .createEscrow(
              ZERO_ADDRESS,
              this.firstEscrowTokenXAmount,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress,
              {
                value: this.escrow20to20Fee,
              }
            )
        ).to.be.revertedWith("x zero address");
      });

      it("revert then createEscrow with zero tokenY address", async function () {
        await expect(
          this.escrow20to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstEscrowTokenXAmount,
              ZERO_ADDRESS,
              this.firstEscrowTokenYAmount,
              this.zeroAddress,
              {
                value: this.escrow20to20Fee,
              }
            )
        ).to.be.revertedWith("y zero address");
      });

      it("revert then createEscrow with zero tokenX amount", async function () {
        await expect(
          this.escrow20to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              ZERO_ADDRESS,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress,
              {
                value: this.escrow20to20Fee,
              }
            )
        ).to.be.revertedWith("x zero amount");
      });

      it("revert then createEscrow with zero tokenY amount", async function () {
        await expect(
          this.escrow20to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstEscrowTokenXAmount,
              this.tokenY.address,
              ZERO_ADDRESS,
              this.zeroAddress,
              {
                value: this.escrow20to20Fee,
              }
            )
        ).to.be.revertedWith("y zero amount");
      });

      it("revert then createEscrow with not enough tokenX", async function () {
        const notEnoughTokenXAmount = 9999999999999;
        await expect(
          this.escrow20to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              notEnoughTokenXAmount,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress,
              {
                value: this.escrow20to20Fee,
              }
            )
        ).to.be.revertedWith("not enought xToken");
      });

      describe("approve tokenX create #0 escrow", function () {
        beforeEach(async function () {
          await this.escrow20to20
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstEscrowTokenXAmount,
              this.tokenY.address,
              this.firstEscrowTokenYAmount,
              this.zeroAddress,
              {
                value: this.escrow20to20Fee,
              }
            );
        });

        it("deployer can claimFee after first createEscrow", async function () {
          await this.escrow20to20
            .connect(this.deployer)
            .claimFee(this.deployer.address);
        });

        it("check escrow #0 exist and open", async function () {
          const escrow = await this.escrow20to20.getEscrow(0);
          expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
          expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
          expect(escrow.xAmount).to.equal(this.firstEscrowTokenXAmount);
          expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
          expect(escrow.yAmount).to.equal(this.firstEscrowTokenYAmount);
          expect(escrow.closed).to.equal(false);
        });

        it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
          expect(
            await this.tokenX.balanceOf(this.tokenXHolder.address)
          ).to.equal(this.mintedXTokens - this.firstEscrowTokenXAmount);
          expect(
            await this.tokenX.balanceOf(this.tokenYHolder.address)
          ).to.equal(0);
          expect(
            await this.tokenY.balanceOf(this.tokenYHolder.address)
          ).to.equal(0);
          expect(
            await this.tokenY.balanceOf(this.tokenXHolder.address)
          ).to.equal(0);
        });

        it("check non author can't cancel escrow #0", async function () {
          await expect(
            this.escrow20to20.connect(this.randomAccount).cancelEscrow(0)
          ).to.be.revertedWith("you'r isn't escrow owner");
        });

        it("revert then getEscrow index out of range", async function () {
          await expect(this.escrow20to20.getEscrow(1)).to.be.revertedWith(
            "Id must be < escrows length"
          );
        });

        describe("cancel create #0 escrow", function () {
          beforeEach(async function () {
            await this.escrow20to20.connect(this.tokenXHolder).cancelEscrow(0);
          });

          it("check escrow #0 exist and closed", async function () {
            const escrow = await this.escrow20to20.getEscrow(0);
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
              this.escrow20to20.connect(this.tokenXHolder).cancelEscrow(0)
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
                .approve(
                  this.escrow20to20.address,
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
                this.escrow20to20.connect(this.tokenYHolder).acceptEscrow(0)
              ).to.be.revertedWith("not enought yToken");
            });

            describe("acceptEscrow #0", function () {
              beforeEach(async function () {
                expect(
                  await this.escrow20to20
                    .connect(this.tokenYHolder)
                    .acceptEscrow(0)
                );
              });

              it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
                expect(
                  await this.tokenX.balanceOf(this.tokenXHolder.address)
                ).to.equal(this.mintedXTokens - this.firstEscrowTokenXAmount);
                expect(
                  await this.tokenX.balanceOf(this.tokenYHolder.address)
                ).to.equal(this.firstEscrowTokenXAmount);
                expect(
                  await this.tokenY.balanceOf(this.tokenYHolder.address)
                ).to.equal(this.mintedYTokens - this.firstEscrowTokenYAmount);
                expect(
                  await this.tokenY.balanceOf(this.tokenXHolder.address)
                ).to.equal(this.firstEscrowTokenYAmount);
              });

              it("check escrow #0 exist and closed", async function () {
                const escrow = await this.escrow20to20.getEscrow(0);
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
                  this.escrow20to20.connect(this.tokenYHolder).acceptEscrow(0)
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
                  .approve(
                    this.escrow20to20.address,
                    this.secondEscrowTokenXAmount
                  );
                await this.escrow20to20
                  .connect(this.tokenXHolder)
                  .createEscrow(
                    this.tokenX.address,
                    this.secondEscrowTokenXAmount,
                    this.tokenY.address,
                    this.secondEscrowTokenYAmount,
                    this.zeroAddress,
                    {
                      value: this.escrow20to20Fee,
                    }
                  );
              });

              it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
                await this.tokenY
                  .connect(this.tokenYHolder)
                  .approve(
                    this.escrow20to20.address,
                    this.firstEscrowTokenYAmount
                  );
                expect(
                  await this.escrow20to20
                    .connect(this.tokenYHolder)
                    .acceptEscrow(0)
                );
              });

              it("check escrow #1 exist and open", async function () {
                const escrow = await this.escrow20to20.getEscrow(1);
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
                  .approve(
                    this.escrow20to20.address,
                    this.secondEscrowTokenXAmount
                  );
                await this.escrow20to20
                  .connect(this.tokenXHolder)
                  .createEscrow(
                    this.tokenX.address,
                    this.secondEscrowTokenXAmount,
                    this.tokenY.address,
                    this.secondEscrowTokenYAmount,
                    this.randomAccount.address,
                    {
                      value: this.escrow20to20Fee,
                    }
                  );
              });

              it("check escrow #1 exist and open", async function () {
                const escrow = await this.escrow20to20.getEscrow(1);
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
                  .approve(
                    this.escrow20to20.address,
                    this.firstEscrowTokenYAmount
                  );
                await expect(
                  this.escrow20to20.connect(this.tokenYHolder).acceptEscrow(1)
                ).to.be.revertedWith("escrow not for you");
              });
            });
          });
        });
      });
    });
  });
});
