const HDWalletProvider = require("truffle-hdwallet-provider");
require("dotenv").config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      network_id: 5777,
      host: "127.0.0.1",
      port: 7545,
    },
    nodeone: {
      host: "51.11.128.110", // Localhost (default: none)
      port: 8001, // Standard Ethereum port (default: none)
      network_id: "5511", // Any network (default: none)
    },
    test: {
      network_id: 5778,
      host: "127.0.0.1",
      port: 10545,
    },
    rinkeby: {
      provider: () =>
        new HDWalletProvider(process.env.MNEMONIC, process.env.REMOTE_NODE),
      network_id: 4,
    },
  },
  compilers: {
    solc: {
      version: "0.5.11", // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    },
  },
};
