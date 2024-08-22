const SCC = artifacts.require('SCC');

module.exports = function (deployer) {
    // Obtém os valores dos parâmetros a partir das variáveis de ambiente
    const param1 = process.env.hash || "hiago";
    const param2 = process.env.capabilities ? process.env.capabilities.split(',') : ["A", "B"];
    deployer.deploy(SCC, param1, param2);
}