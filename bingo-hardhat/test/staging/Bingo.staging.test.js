const { assert } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Bingo Unit Tests", function () {
        let bingo, bingoContract, deployer, entranceFee;

        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer;
            bingoContract = await ethers.getContract("Bingo")
            bingo = await ethers.getContract("Bingo", deployer)
            entranceFee = await bingo.getEntranceFee();
        })

        describe("fulfillRandomWords", function () {
            it("Live Chainlink Keepers and Chainlink VRF Working, Bingo Winner", async function () {
                console.log("Setting up test...")
                const startingTimeStamp = await bingo.getLastTimeStamp()
                const accounts = await ethers.getSigners()

                console.log("Setting up Listener...")
                await new Promise(async (resolve, reject) => {

                    bingo.once("WinnerPicked", async () => {
                        console.log("WinnerPicked event fired!")
                        try {

                            const recentWinner = await bingo.getBingoWinner()
                            const bingoState = await bingo.getBingoState()
                            const winnerEndingBalance = await accounts[0].getBalance()
                            const endingTimeStamp = await bingo.getLastTimeStamp()

                            await expect(bingo.getPlayers(0)).to.be.reverted
                            assert.equal(recentWinner.toString(), accounts[0].address)
                            assert.equal(bingoState, 0)
                            assert.equal(
                                winnerEndingBalance.toString(),
                                winnerStartingBalance.add(entranceFee).toString()
                            )
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve()
                        } catch (error) {
                            console.log(error)
                            reject(error)
                        }
                    })

                    console.log("Entering Bingo...")
                    const tx = await bingo.enterBingo({ value: entranceFee })
                    await tx.wait(1)
                    console.log("Ok, time to wait...")
                    const winnerStartingBalance = await accounts[0].getBalance()


                })
            })
        })
    })
