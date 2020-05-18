const expect = require("expect");
const request = require("supertest");
const Web3 = require("web3");
const web3 = new Web3(
  new Web3.providers.HttpProvider("http://127.0.0.1:10545")
);
const { abi } = require("./build/contracts/TrackerContract.json");

var contractInstance = new web3.eth.Contract(
  abi,
  "0x4a18A3AE4f26596369E74Be9d3D0d11bcDFE62e9"
);

const dateAdded = new Date();
let stringDate =
  dateAdded.toLocaleDateString() + " at " + dateAdded.toLocaleTimeString();

describe("Creating contract for a product", (accounts) => {
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

describe("Create a user", (accounts) => {
  it("transaction should be rejected because account address is used already", async () => {
    let response;
    try {
      response = await contractInstance.methods
        .addUser(accounts[1], "Company", "manufacturer", stringDate)
        .send({
          from: accounts[1],
          gas: 3000000,
        });
      expect(response).rejects;
    } catch (error) {
      expect(response).rejects;
    }
  });
  it("transaction should be rejected because this account cannot add users", async () => {
    let response;
    try {
      response = await contractInstance.methods
        .addUser(accounts[8], "Company", "manufacturer", stringDate)
        .send({
          from: accounts[8],
          gas: 3000000,
        });
      expect(response).rejects;
    } catch (error) {
      expect(response).rejects;
    }
  });
});

describe("Transfer product", (accounts) => {
  it("transaction should be rejected because this account does not exist", async () => {
    let response;
    try {
      response = await contractInstance.methods
        .transferProduct(
          accounts[8],
          "0x72017f2c84cd95a922c7c1fed84690b1d1a555c6",
          1,
          "Expensive shoes",
          50,
          5,
          stringDate
        )
        .send({
          from: accounts[8],
          gas: 3000000,
        });
      expect(response).rejects;
    } catch (error) {
      expect(response).rejects;
    }
  });

  it("transaction should be rejected because this account does not own the product", async () => {
    let response;
    try {
      response = await contractInstance.methods
        .transferProduct(
          accounts[5],
          "0x72017f2c84cd95a922c7c1fed84690b1d1a555c6",
          1,
          "Expensive shoes",
          50,
          5,
          stringDate
        )
        .send({
          from: accounts[4],
          gas: 3000000,
        });
      expect(response).rejects;
    } catch (error) {
      expect(response).rejects;
    }
  });
});

describe("Sell product", (accounts) => {
  it("transaction should be rejected because the product is not in shop", async () => {
    let response;
    try {
      response = await contractInstance.methods
        .resellProduct(
          "0x72017f2c84cd95a922c7c1fed84690b1d1a555c6",
          "secretCode",
          "resetSecretCode"
        )
        .send({
          from: accounts[4],
          gas: 3000000,
        });
      expect(response).rejects;
    } catch (error) {
      expect(response).rejects;
    }
  });
});
