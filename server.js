//imports
const express = require("express");
const Web3 = require("web3");
require("dotenv").config();
const CustomError = require("./utils/CustomError");
const app = express();
const writeFeedback = require("./utils/writeFeedback");
const exceptionHandler = require("./utils/exceptionHandler");
const promisify = require("./utils/promisify");

//setting up environment
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCAL_NODE));
const PORT = process.env.PORT || 5000;
const abi = JSON.parse(
  '[{"inputs": [],"payable": false,"stateMutability": "nonpayable","type": "constructor"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "_newContractAddress","type": "address"},{"indexed": true,"internalType": "address","name": "_contractCreator","type": "address"},{"indexed": false,"internalType": "string","name": "_productName","type": "string"}],"name": "ProvenanceContractDeployed","type": "event"},{"constant": true,"inputs": [{"internalType": "uint256","name": "","type": "uint256"}],"name": "users","outputs": [{"internalType": "address","name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_seller","type": "address"},{"internalType": "string","name": "_productName","type": "string"}],"name": "createProvenanceContract","outputs": [{"internalType": "address","name": "newContract","type": "address"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_accountAddress","type": "address"},{"internalType": "string","name": "_name","type": "string"},{"internalType": "string","name": "_location","type": "string"}],"name": "addManufacturer","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_accountAddress","type": "address"},{"internalType": "string","name": "_name","type": "string"},{"internalType": "string","name": "_location","type": "string"},{"internalType": "string","name": "_role","type": "string"}],"name": "addUser","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [],"name": "getAllProducts","outputs": [{"internalType": "address[]","name": "","type": "address[]"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"internalType": "address","name": "_deployedContractAddress","type": "address"}],"name": "getProductState","outputs": [{"internalType": "string","name": "","type": "string"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"internalType": "address","name": "_deployedContractAddress","type": "address"}],"name": "getProductName","outputs": [{"internalType": "string","name": "","type": "string"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_newParty","type": "address"},{"internalType": "address","name": "_contract","type": "address"}],"name": "transfer","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"}],"name": "returnProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"},{"internalType": "string","name": "_newBuyer","type": "string"}],"name": "resellProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"}],"name": "sellProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_productName","type": "string"}],"name": "changeProductDetails","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [{"internalType": "address","name": "_contract","type": "address"}],"name": "getProductCurrentOwner","outputs": [{"internalType": "address","name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"}]'
);
var con = web3.eth.contract(abi);
var contractInstance = con.at("0x3449BB31ad95585Fe455b0713d2286a3FEcf0a50");
let accounts;

//middleware functions
const initAccounts = async (req, res, next) => {
  if (!accounts) accounts = await promisify(web3.eth.getAccounts);
  next();
};

// initialize accounts
app.use(express.json({ extended: false }));
app.use(initAccounts);

// API functions

const createUser = async (req, res) => {
  let { userAddress, name, location, role } = req.body;
  if (!accounts.includes(userAddress.toLowerCase()))
    throw new CustomError("Invalid account address", 400);
  if (role && role.toLowerCase() !== "manufacturer")
    await contractInstance.addUser(userAddress, name, location, role, {
      from: accounts[0],
      gas: 3000000
    });
  else
    await contractInstance.addManufacturer(userAddress, name, location, {
      from: accounts[0],
      gas: 3000000
    });
  res
    .status(201)
    .json({ success: "Successfully added new " + (role ? role : "User") });
};

const createProductContract = async (req, res) => {
  const { userAddress, sellerAddress, productName } = req.body;
  if (
    !accounts.includes(userAddress.toLowerCase()) ||
    !accounts.includes(sellerAddress.toLowerCase())
  )
    throw new CustomError("Invalid account address", 400);

  const result = await promisify(
    web3.eth.getTransactionReceipt,
    await contractInstance.createProvenanceContract(
      sellerAddress,
      productName,
      { from: userAddress, gas: 3000000 }
    )
  );
  res.status(201).json({ contractAddress: result.logs[0].topics[1] });
};

const changeProductDetails = async (req, res) => {
  const { contract, newProductName, userAddress } = req.body;
  if (!accounts.includes(userAddress))
    throw new CustomError("Invalid account address", 400);
  await contractInstance.changeProductDetails(contract, newProductName, {
    from: userAddress,
    gas: 3000000
  });
};

const getAllProducts = async (req, res) => {
  const { userAddress } = req.body;
  if (!accounts.includes(userAddress))
    throw new CustomError("Account does not exist", 400);
  const products = await contractInstance.getAllProducts({
    from: userAddress,
    gas: 3000000
  });
  res.status(200).json({ products });
};

const getAccounts = (req, res) => {
  res.status(200).json({ accounts });
};

const getProductCurrentOwner = async (req, res) => {
  const { contract } = req.body;
  const owner = await contractInstance.getProductCurrentOwner(contract);
  res.status(200).json({ owner });
};

// get the details of a product, name for starters
const getProductDetails = async (req, res) => {
  const { address } = req.body;
  const productName = await contractInstance.getProductName(address);
  res.status(200).json({ product: productName });
};

const getProductState = async (req, res) => {
  const { contract } = req.body;
  const state = await contractInstance.getProductState(contract);
  res.status(200).json({ state });
};

const returnProduct = async (req, res) => {
  const { contract, buyer, seller } = req.body;
  if (!accounts.includes(seller.toLowerCase()))
    throw new CustomError("Product cannot be returned here", 400);
  await contractInstance.returnProduct(contract, buyer, {
    from: seller,
    gas: 3000000
  });
  res.status(200).json({ message: "Product returned" });
};

const resellProduct = async (req, res) => {
  const { contract, seller, buyer, newBuyer } = req.body;
  if (!accounts.includes(seller.toLowerCase()))
    throw new CustomError("Product cannot be resold here", 400);
  await contractInstance.resellProduct(contract, buyer, newBuyer, {
    from: seller,
    gas: 3000000
  });
  res.status(200).json({ message: "Successfully transferred property" });
};

const sellProduct = async (req, res) => {
  const { contract, buyer, seller } = req.body;
  if (!accounts.includes(seller.toLowerCase()))
    throw new CustomError("Product cannot be sold here", 400);
  await contractInstance.sellProduct(contract, buyer, {
    from: seller,
    gas: 3000000
  });
  res.status(200).json({ message: "Successfully finished transaction" });
};

const transferProduct = async (req, res) => {
  const { originAddress, destinationAddress, contractAddress } = req.body;
  if (
    !accounts.includes(originAddress.toLowerCase()) ||
    !accounts.includes(destinationAddress.toLowerCase())
  )
    throw new CustomError("Transit party does not exist", 400);
  await contractInstance.transfer(destinationAddress, contractAddress, {
    from: originAddress,
    gas: 3000000
  });
  res.status(200).json({ message: "Successfully transferred product" });
};

// api paths

// GET
app.get("/accounts", exceptionHandler(getAccounts));
app.get("/product-details", exceptionHandler(getProductDetails));
app.get("/all-products", exceptionHandler(getAllProducts));
app.get("/product-state", exceptionHandler(getProductState));
app.get("/contract-owner", exceptionHandler(getProductCurrentOwner));

// POST
app.post("/add-user", exceptionHandler(createUser));
app.post("/add-contract", exceptionHandler(createProductContract));
app.post("/transfer-product", exceptionHandler(transferProduct));
app.post("/return-product", exceptionHandler(returnProduct));
app.post("/resell-product", exceptionHandler(resellProduct));
app.post("/sell-product", exceptionHandler(sellProduct));
app.post("/edit-product", exceptionHandler(changeProductDetails));

// Handling pages not found
app.use((req, res, next) => {
  res.status(404).send({ feedback: writeFeedback("Resource not found") });
});

// Global error handling through middleware
app.use((err, req, res, next) => {
  console.log(err);
  if (err.statusCode) {
    return res.status(err.statusCode).json(writeFeedback(err.message));
  }
  res.status(500).json(writeFeedback(err.message));
});

app.listen(PORT, () => console.log(`NodeJS API is listening on port ${PORT}`));
