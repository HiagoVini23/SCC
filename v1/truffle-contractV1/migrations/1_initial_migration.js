const SCC = artifacts.require('SCC');
const ethers = require("ethers");

module.exports = function (deployer) {
    // Obtém os valores dos parâmetros a partir das variáveis de ambiente
    const param1 = process.env.hash || "hiago";
    let param2 = process.env.capabilities ? process.env.capabilities.split(',') : ["A", "B"];

    // Converte cada elemento para bytes32
    param2 = param2.map(ethers.utils.formatBytes32String);
    deployer.deploy(SCC, param1, param2);
}