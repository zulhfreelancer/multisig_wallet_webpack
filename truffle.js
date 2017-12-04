// Allows us to use ES6 in our migrations and tests.
require('babel-register')

// manage secrets
require('dotenv').config();

// https://github.com/trufflesuite/truffle-hdwallet-provider/pull/2
var privateKey = "xxx";

// To help us deploy smart contract to TestNet or MainNet
var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = process.env.MNEMONIC;

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      gas: 6712390,
      network_id: '*' // Match any network id
    }
    ,
    ropsten: {
      provider: function() {
        return new HDWalletProvider(privateKey, "xxx")
      },
      network_id: 3,
      gas: 3000000,
      from: "xxx"
    }
  }
}
