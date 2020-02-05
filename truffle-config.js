const HDWalletProvider = require('truffle-hdwallet-provider');
require('dotenv').config() 

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    "development": {
      network_id: "*",
      host: "127.0.0.1",
      port: 7545
    }, rinkeby : {
      provider: () => new HDWalletProvider(process.env.MNEMONIC,process.env.REMOTE_NODE),
      network_id: 4
    }
  }
};