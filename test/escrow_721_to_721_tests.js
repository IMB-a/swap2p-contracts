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
    this.Escrow721To721Artifact = await ethers.getContractFactory(
      "Escrow721To721"
    );
    this.tokenXArtifact = await ethers.getContractFactory("ERC721XMock");
    this.tokenYArtifact = await ethers.getContractFactory("ERC721YMock");
  });

  beforeEach(async function () {
    this.swap2p = await this.Swap2pArtifact.deploy();
    this.escrow721to721Fee = ethers.BigNumber.from(1);
    this.escrow721to721 = await this.Escrow721To721Artifact.deploy(
      this.swap2p.address,
      this.escrow721to721Fee
    );
    this.tokenX = await this.tokenXArtifact.deploy();
    this.tokenY = await this.tokenYArtifact.deploy();
  });

  it("should be deployed", async function () {
    expect(await this.escrow721to721.deployed());
    expect(await this.tokenX.deployed());
    expect(await this.tokenY.deployed());
  });

  it("revert then no escrows", async function () {
    await expect(this.escrow721to721.getEscrow(0)).to.be.revertedWith(
      "no escrows"
    );
  });

  describe("mint tokenX", function () {
    beforeEach(async function () {
      await this.tokenX.connect(this.deployer).mint(this.tokenXHolder.address);
      await this.tokenX.connect(this.deployer).mint(this.randomAccount.address);
      await this.swap2p
        .connect(this.deployer)
        .mint(this.tokenXHolder.address, this.escrow721to721Fee);
    });

    describe("approve tokenX for escrow721to721", function () {
      beforeEach(async function () {
        this.zeroAddress = ZERO_ADDRESS;
        this.firstXIndex = 0;
        this.firstYIndex = 0;
        await this.tokenX
          .connect(this.tokenXHolder)
          .approve(this.escrow721to721.address, this.firstXIndex);
        await this.swap2p
          .connect(this.tokenXHolder)
          .approve(this.escrow721to721.address, this.escrow721to721Fee);
      });

      it("revert then createEscrow with a tokenX that is not yours", async function () {
        const secondTokenIndex = 1;
        await expect(
          this.escrow721to721
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              secondTokenIndex,
              this.tokenY.address,
              this.firstYIndex,
              this.zeroAddress
            )
        ).to.be.revertedWith("you don't have a token");
      });

      it("revert then createEscrow with zero tokenX address", async function () {
        await expect(
          this.escrow721to721
            .connect(this.tokenXHolder)
            .createEscrow(
              ZERO_ADDRESS,
              this.firstXIndex,
              this.tokenY.address,
              this.firstYIndex,
              this.zeroAddress
            )
        ).to.be.revertedWith("x zero address");
      });

      it("revert then createEscrow with zero tokenY address", async function () {
        await expect(
          this.escrow721to721
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstXIndex,
              ZERO_ADDRESS,
              this.firstYIndex,
              this.zeroAddress
            )
        ).to.be.revertedWith("y zero address");
      });

      describe("change fee", function () {
        beforeEach(async function () {
          this.escrow721to721NewFee = this.escrow721to721Fee.mul(
            ethers.BigNumber.from(2)
          );
          await this.escrow721to721
            .connect(this.deployer)
            .setFee(this.escrow721to721NewFee);
        });

        it("revert then createEscrow with old fee", async function () {
          await expect(
            this.escrow721to721
              .connect(this.tokenXHolder)
              .createEscrow(
                this.tokenX.address,
                this.firstXIndex,
                this.tokenY.address,
                this.firstYIndex,
                this.zeroAddress
              )
          ).to.be.revertedWith("not enough SPP");
        });
      });

      describe("approve tokenX create #0 escrow", function () {
        beforeEach(async function () {
          await this.escrow721to721
            .connect(this.tokenXHolder)
            .createEscrow(
              this.tokenX.address,
              this.firstXIndex,
              this.tokenY.address,
              this.firstYIndex,
              this.zeroAddress
            );
        });

        it("deployer can claimFee after first createEscrow", async function () {
          await this.escrow721to721
            .connect(this.deployer)
            .claimFee(this.deployer.address);
        });

        it("check escrow #0 exist and open", async function () {
          const escrow = await this.escrow721to721.getEscrow(0);
          expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
          expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
          expect(escrow.xIndex).to.equal(this.firstXIndex);
          expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
          expect(escrow.yIndex).to.equal(this.firstYIndex);
          expect(escrow.yOwner).to.equal(this.zeroAddress);
          expect(escrow.closed).to.equal(false);
        });

        it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
          expect(await this.tokenX.ownerOf(this.firstXIndex)).to.equal(
            this.escrow721to721.address
          );
        });

        it("check non author can't cancel escrow #0", async function () {
          await expect(
            this.escrow721to721.connect(this.randomAccount).cancelEscrow(0)
          ).to.be.revertedWith("you'r isn't escrow owner");
        });

        it("revert then getEscrow index out of range", async function () {
          await expect(this.escrow721to721.getEscrow(1)).to.be.revertedWith(
            "Id must be < escrows length"
          );
        });

        describe("cancel create #0 escrow", function () {
          beforeEach(async function () {
            await this.escrow721to721
              .connect(this.tokenXHolder)
              .cancelEscrow(0);
          });

          it("check escrow #0 exist and closed", async function () {
            const escrow = await this.escrow721to721.getEscrow(0);
            expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
            expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
            expect(escrow.xIndex).to.equal(this.firstXIndex);
            expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
            expect(escrow.yIndex).to.equal(this.firstYIndex);
            expect(escrow.closed).to.equal(true);
          });

          it("revert then cancel already closed escrow", async function () {
            await expect(
              this.escrow721to721.connect(this.tokenXHolder).cancelEscrow(0)
            ).to.be.revertedWith("escrow already closed");
          });
        });

        describe("mint first tokenY", function () {
          beforeEach(async function () {
            await this.tokenY
              .connect(this.deployer)
              .mint(this.tokenYHolder.address);
          });

          it("revert then createEscrow with a tokenY that is not yours", async function () {
            await expect(
              this.escrow721to721.connect(this.randomAccount).acceptEscrow(0)
            ).to.be.revertedWith("you don't have a token");
          });

          describe("approve tokenY", function () {
            beforeEach(async function () {
              await this.tokenY
                .connect(this.tokenYHolder)
                .approve(this.escrow721to721.address, this.firstYIndex);
            });

            describe("acceptEscrow #0", function () {
              beforeEach(async function () {
                expect(
                  await this.escrow721to721
                    .connect(this.tokenYHolder)
                    .acceptEscrow(0)
                );
              });

              it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
                expect(await this.tokenX.ownerOf(this.firstXIndex)).to.equal(
                  this.tokenYHolder.address
                );
                expect(await this.tokenY.ownerOf(this.firstYIndex)).to.equal(
                  this.tokenXHolder.address
                );
              });

              it("check escrow #0 exist and closed", async function () {
                const escrow = await this.escrow721to721.getEscrow(0);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xIndex).to.equal(this.firstXIndex);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yIndex).to.equal(this.firstYIndex);
                expect(escrow.yOwner).to.equal(this.zeroAddress);
                expect(escrow.closed).to.equal(true);
              });

              it("revert then trying accept closed escrow", async function () {
                await expect(
                  this.escrow721to721.connect(this.tokenYHolder).acceptEscrow(0)
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
                  .approve(this.escrow721to721.address, this.thirdIndex);
                await this.swap2p
                  .connect(this.deployer)
                  .mint(this.tokenXHolder.address, this.escrow721to721Fee);
                await this.swap2p
                  .connect(this.tokenXHolder)
                  .approve(this.escrow721to721.address, this.escrow721to721Fee);
                await this.escrow721to721
                  .connect(this.tokenXHolder)
                  .createEscrow(
                    this.tokenX.address,
                    this.thirdIndex,
                    this.tokenY.address,
                    this.firstYIndex,
                    this.zeroAddress
                  );
              });

              it("tokenXHolder and tokenYHolder have right balanceOf tokenX and tokenY", async function () {
                await this.tokenY
                  .connect(this.tokenYHolder)
                  .approve(this.escrow721to721.address, this.firstYIndex);
                expect(
                  await this.escrow721to721
                    .connect(this.tokenYHolder)
                    .acceptEscrow(0)
                );
              });

              it("check escrow #1 exist and open", async function () {
                const escrow = await this.escrow721to721.getEscrow(0);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xIndex).to.equal(this.firstXIndex);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yIndex).to.equal(this.firstYIndex);
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
                  .approve(this.escrow721to721.address, this.thirdIndex);
                await this.swap2p
                  .connect(this.deployer)
                  .mint(this.tokenXHolder.address, this.escrow721to721Fee);
                await this.swap2p
                  .connect(this.tokenXHolder)
                  .approve(this.escrow721to721.address, this.escrow721to721Fee);
                await this.escrow721to721
                  .connect(this.tokenXHolder)
                  .createEscrow(
                    this.tokenX.address,
                    this.thirdIndex,
                    this.tokenY.address,
                    this.firstYIndex,
                    this.randomAccount.address
                  );
              });

              it("check escrow #1 exist and open", async function () {
                const escrow = await this.escrow721to721.getEscrow(0);
                expect(escrow.xOwner).to.equal(this.tokenXHolder.address);
                expect(escrow.xTokenContractAddr).to.equal(this.tokenX.address);
                expect(escrow.xIndex).to.equal(this.firstXIndex);
                expect(escrow.yTokenContractAddr).to.equal(this.tokenY.address);
                expect(escrow.yIndex).to.equal(this.firstYIndex);
                expect(escrow.yOwner).to.equal(this.zeroAddress);
                expect(escrow.closed).to.equal(false);
              });

              it("revert then yOwner trying to accept escrow not for itself", async function () {
                await this.tokenY
                  .connect(this.tokenYHolder)
                  .approve(this.escrow721to721.address, this.firstYIndex);
                await expect(
                  this.escrow721to721.connect(this.tokenYHolder).acceptEscrow(1)
                ).to.be.revertedWith("escrow not for you");
              });
            });
          });
        });
      });
    });
  });
});
