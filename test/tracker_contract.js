const expect = require("expect");
const request = require("supertest");
const Web3 = require("web3");
const web3 = new Web3(
  new Web3.providers.HttpProvider("http://127.0.0.1:10545")
);
const abi = JSON.parse(
  '[{"inputs": [],"payable": false,"stateMutability": "nonpayable","type": "constructor"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "companyAddress","type": "address"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "string","name": "branchName","type": "string"},{"indexed": false,"internalType": "string","name": "latitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "longitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "BranchEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "productContractAddress","type": "address"},{"indexed": true,"internalType": "address","name": "manufacturerAddress","type": "address"},{"indexed": true,"internalType": "uint256","name": "productId","type": "uint256"},{"indexed": false,"internalType": "string","name": "manufacturerName","type": "string"},{"indexed": false,"internalType": "string","name": "productName","type": "string"},{"indexed": false,"internalType": "string","name": "linkToMerch","type": "string"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "ProductEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "transferredTo","type": "address"},{"indexed": true,"internalType": "uint256","name": "productId","type": "uint256"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "string","name": "productName","type": "string"},{"indexed": false,"internalType": "string","name": "latitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "longitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "dateTransferred","type": "string"}],"name": "TransitEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "userAddress","type": "address"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "bool","name": "companyDisabled","type": "bool"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "UserEvent","type": "event"},{"constant": true,"inputs": [{"internalType": "string","name": "_name","type": "string"}],"name": "getAccountDetails","outputs": [{"internalType": "address","name": "companyAddress","type": "address"},{"internalType": "bool","name": "disabled","type": "bool"},{"internalType": "string","name": "key","type": "string"},{"internalType": "enum TrackerContract.RoleType","name": "role","type": "uint8"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_seller","type": "address"},{"internalType": "string","name": "_productName","type": "string"},{"internalType": "string","name": "_linkToMerch","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "createProvenanceContract","outputs": [{"internalType": "uint256","name": "newProductId","type": "uint256"},{"internalType": "string","name": "company","type": "string"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_accountAddress","type": "address"},{"internalType": "string","name": "_name","type": "string"},{"internalType": "string","name": "_password","type": "string"},{"internalType": "string","name": "_role","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "addUser","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "string","name": "_branchName","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "addBranch","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_newParty","type": "address"},{"internalType": "address","name": "_contract","type": "address"},{"internalType": "uint256","name": "_productId","type": "uint256"},{"internalType": "string","name": "productName","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateTransferred","type": "string"}],"name": "transferProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"}],"name": "returnProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"},{"internalType": "string","name": "_newBuyer","type": "string"}],"name": "resellProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"}],"name": "sellProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_productName","type": "string"}],"name": "changeProductDetails","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [{"internalType": "address","name": "_contract","type": "address"}],"name": "getProductCurrentOwner","outputs": [{"internalType": "address","name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"}]'
);
var contractInstance = new web3.eth.Contract(
  abi,
  "0x4a18A3AE4f26596369E74Be9d3D0d11bcDFE62e9"
);

describe("TrackerContract testing", (accounts) => {
  it("the company address should be found and equal to the expected output", async () => {
    const {
      companyAddress: actual,
    } = await contractInstance.methods
      .getAccountDetails("Tesco")
      .call({ from: accounts[0], gas: 3000000 });
    const expected = "0xc28832fA1C02037A81bb5D543Ee4d1fae95dcbf4";
    assert.equal(expected, actual);
  });

  it("promise should be rejected and a certain error is expected", async () => {
    try {
      const val = await contractInstance.methods
        .getAccountDetails("nada")
        .call({ from: accounts[0], gas: 3000000 });
      expect(val).rejects;
    } catch (error) {
      assert.equal(
        error.message,
        "Returned error: VM Exception while processing transaction: revert Invalid login attempt"
      );
    }
  });

  it("transaction should trigger two events, ProductEvent and TransitEvent", async () => {
    const response = await contractInstance.methods
      .createProvenanceContract(
        accounts[3],
        "nikey dikey",
        "https://www.nike.com/gb/t/react-phantom-run-flyknit-2-running-shoe-tV8Xkw/CJ0277-002",
        "50.3232",
        "-0.1234",
        new Date().toISOString()
      )
      .send({
        from: accounts[1],
        gas: 3000000,
      });
    expect(response.events.ProductEvent).toBeDefined();
    expect(response.events.TransitEvent).toBeDefined();
  });

  it("transaction should be rejected because of the missing parameters", async () => {
    let response;
    try {
      response = await contractInstance.methods
        .createProvenanceContract(
          accounts[3],
          "nikey dikey",
          "-0.1234",
          new Date().toISOString()
        )
        .send({
          from: accounts[1],
          gas: 3000000,
        });
      expect(response).rejects;
    } catch (error) {
      expect(response).rejects;
    }
  });
});
