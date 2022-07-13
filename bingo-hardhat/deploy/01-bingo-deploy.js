const { ethers } = require("ethers");
const { network } = require("../hardhat.config");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");

module.exports = async function ({ getnamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getnamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordiatorV2address;

    if (developmentChains.includes(network.name)) {
        const vrfCoordiatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordiatorV2address = vrfCoordiatorV2Mock.address;
    } else {
        vrfCoordiatorV2address = networkConfig[chainId]["vrfCoordiatorV2"];
    }

    const bingo = await deploy("Bingo", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    }
    )
}