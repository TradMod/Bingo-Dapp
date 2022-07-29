const { assert } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Bingo Unit Tests", function () {
        let bingo, vrfCoordinatorV2Mock, bingoContract;
        const chainId = network.config.chainId;
        const entranceFee = networkConfig[chainId]["entranceFee"]

        beforeEach(async function () {
            const { deployer } = await getNamedAccounts();
            await deployments.fixture(["all"])
            bingo = await ethers.getContract("Bingo", deployer)
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await bingo.enterBingo({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_miner", "0x")
            bingoContract = await ethers.getContract("Bingo")
            bingo = bingoContract.connect(player)
        })

        describe("Bingo", function () {
            it("Bingo Winner Picked, Bingo Reset & Money sent to the Bingo Winner", async () => {
                const additionalEntrances = 3
                const startingIndex = 1
                for (let i = startingIndex; i < startingIndex + additionalEntrances; i++) {
                    bingo = bingoContract.connect(accounts[i])
                    await bingo.enterBingo({ value: ethers.utils.parseEther("5") })
                }
                const startingTimeStamp = await bingo.getLastTimeStamp()

                await new Promise(async (resolve, reject) => {
                    bingo.once("WinnerPicked", async () => {
                        console.log("WinnerPicked event fired!")
                        try {
                            const recentWinner = await bingo.getBingoWinner()
                            const bingoState = await bingo.getBingoState()
                            const winnerBalance = await accounts[2].getBalance()
                            const endingTimeStamp = await bingo.getLastTimeStamp()
                            await expect(bingo.getPlayer(0)).to.be.reverted
                            // Comparisons to check if our ending values are correct:
                            assert.equal(recentWinner.toString(), accounts[2].address)
                            assert.equal(bingoState, 0)
                            assert.equal(
                                winnerBalance.toString(),
                                startingBalance
                                    .add(
                                        entranceFee
                                            .mul(additionalEntrances)
                                            .add(entranceFee)
                                    )
                                    .toString()
                            )
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve()
                        } catch (e) {
                            reject(e)
                        }
                    })

                    const tx = await bingo.performUpkeep("0x")
                    const txReceipt = await tx.wait(1)
                    const startingBalance = await accounts[2].getBalance()
                    await vrfCoordinatorV2Mock.fulfillRandomWords(
                        txReceipt.events[1].args.requestId,
                        bingo.address
                    )
                })
            })
        })
    })