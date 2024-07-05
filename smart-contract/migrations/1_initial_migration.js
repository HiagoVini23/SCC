const SCC = artifacts.require('SCC');

module.exports = function (deployer){
    deployer.deploy(SCC, "hiago", ["A", "B"])
}