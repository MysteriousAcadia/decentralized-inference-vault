const hre = require("hardhat");
console.log(hre.ethers.keccak256(hre.ethers.toUtf8Bytes("test-salt")));
