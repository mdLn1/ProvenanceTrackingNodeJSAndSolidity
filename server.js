//imports
const express = require("express");
const Web3 = require("web3");
require("dotenv").config();
const CustomError = require("./utils/CustomError");
const app = express();
const writeFeedback = require("./utils/writeFeedback");
const exceptionHandler = require("./utils/exceptionHandler");
const promisify = require("./utils/promisify");
const { encrypt, decrypt } = require("./utils/encryption");
//setting up environment
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCAL_NODE));
const PORT = process.env.PORT || 5000;
const abi = JSON.parse(
  '[{"inputs": [],"payable": false,"stateMutability": "nonpayable","type": "constructor"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "companyAddress","type": "address"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "string","name": "branchName","type": "string"},{"indexed": false,"internalType": "string","name": "latitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "longitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "BranchEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "productContractAddress","type": "address"},{"indexed": true,"internalType": "address","name": "manufacturerAddress","type": "address"},{"indexed": true,"internalType": "uint256","name": "productId","type": "uint256"},{"indexed": false,"internalType": "string","name": "manufacturerName","type": "string"},{"indexed": false,"internalType": "string","name": "productName","type": "string"},{"indexed": false,"internalType": "string","name": "linkToMerch","type": "string"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "ProductEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "transferredTo","type": "address"},{"indexed": true,"internalType": "uint256","name": "productId","type": "uint256"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "string","name": "productName","type": "string"},{"indexed": false,"internalType": "string","name": "latitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "longitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "dateTransferred","type": "string"}],"name": "TransitEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "userAddress","type": "address"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "bool","name": "companyDisabled","type": "bool"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "UserEvent","type": "event"},{"constant": true,"inputs": [{"internalType": "string","name": "_name","type": "string"},{"internalType": "string","name": "_password","type": "string"}],"name": "loginUser","outputs": [{"internalType": "address","name": "companyAddress","type": "address"},{"internalType": "bool","name": "disabled","type": "bool"},{"internalType": "enum TrackerContract.RoleType","name": "role","type": "uint8"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_seller","type": "address"},{"internalType": "string","name": "_productName","type": "string"},{"internalType": "string","name": "_linkToMerch","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "createProvenanceContract","outputs": [{"internalType": "uint256","name": "newProductId","type": "uint256"},{"internalType": "string","name": "company","type": "string"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_accountAddress","type": "address"},{"internalType": "string","name": "_name","type": "string"},{"internalType": "string","name": "_password","type": "string"},{"internalType": "string","name": "_role","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "addUser","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "string","name": "_branchName","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "addBranch","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_newParty","type": "address"},{"internalType": "address","name": "_contract","type": "address"},{"internalType": "uint256","name": "_productId","type": "uint256"},{"internalType": "string","name": "productName","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateTransferred","type": "string"}],"name": "transferProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"}],"name": "returnProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"},{"internalType": "string","name": "_newBuyer","type": "string"}],"name": "resellProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"}],"name": "sellProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_productName","type": "string"}],"name": "changeProductDetails","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [{"internalType": "address","name": "_contract","type": "address"}],"name": "getProductCurrentOwner","outputs": [{"internalType": "address","name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"}]'
);
var contractInstance = new web3.eth.Contract(
  abi,
  "0x66aB52a6b4B837AB86F10b2C7EDdD5A1dC567317"
);
let accounts;

// existing roles
const roles = ["manufacturer", "seller", "distributor"];

//middleware functions
const initAccounts = async (req, res, next) => {
  if (!accounts) accounts = await promisify(web3.eth.getAccounts);
  accounts = accounts.map((el) => el.toLowerCase());
  next();
};

// initialize accounts
app.use(express.json({ extended: false }));
app.use(initAccounts);

// API functions

const hello = (req, res) => {
  res.status(200).json({ message: "hello" });
};

const test = async (req, res) => {
  const contract = await contractInstance.getPastEvents("ProductEvent", {
    filter: {
      _newContractAddress: ["0x98d9d66d5d2602df469051ed57c3aaf940d6126f"],
    },
    fromBlock: 0,
    toBlock: "latest",
  });
  return res.status(200).json(contract);
};

app.use("/test", exceptionHandler(test));

const createUser = async (req, res) => {
  let { senderAddress, userToCreateAddress, name, password, role } = req.body;
  if (
    !accounts.includes(userToCreateAddress.toLowerCase()) ||
    !accounts.includes(senderAddress.toLowerCase())
  )
    throw new CustomError("Invalid account address", 400);
  role = role.toLowerCase();
  if (!roles.includes(role))
    throw new CustomError("Chosen role does not exist", 400);
  let users = await contractInstance.getPastEvents("UserEvent", {
    filter: { userAddress: [userToCreateAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (users.length > 0) {
    throw new CustomError("User already exists", 400);
  }
  const currentDate = new Date().toISOString();
  await contractInstance.methods
    .addUser(userToCreateAddress, name, password, role, currentDate)
    .send({
      from: senderAddress,
      gas: 3000000,
    });
  res
    .status(201)
    .json({ success: "Successfully added new " + (role ? role : "User") });
};

const createProductContract = async (req, res) => {
  const {
    senderAddress,
    sellerAddress,
    productName,
    linkToMerch,
    latitude,
    longitude,
  } = req.body;
  if (
    !accounts.includes(senderAddress.toLowerCase()) ||
    !accounts.includes(sellerAddress.toLowerCase())
  )
    throw new CustomError("Invalid account address", 400);
  const currentDate = new Date().toISOString();

  const newProduct = await contractInstance.methods
    .createProvenanceContract(
      sellerAddress,
      productName,
      linkToMerch,
      latitude.toString(),
      longitude.toString(),
      currentDate
    )
    .send({
      from: senderAddress,
      gas: 3000000,
    });
  res.status(201).json({ product: newProduct.events.ProductEvent });
};

// you need to check this one, add more options
const changeProductDetails = async (req, res) => {
  const { contractAddress, newProductName, senderAddress } = req.body;
  if (!accounts.includes(senderAddress.toLowerCase()))
    throw new CustomError("Invalid account address", 400);
  await contractInstance.changeProductDetails(contractAddress, newProductName, {
    from: senderAddress,
    gas: 3000000,
  });
};

const getAllProducts = async (req, res) => {
  const { senderAddress } = req.body;
  if (!accounts.includes(senderAddress.toLowerCase()))
    throw new CustomError("Account does not exist", 400);
  let products = await contractInstance.getPastEvents("ProductEvent", {
    filter: { manufacturerAddress: [senderAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  res.status(200).json(products.map((el) => ({ ...el.returnValues })));
};

const getAccounts = async (req, res) => {
  res.status(200).json({ accounts });
};

const getProductCurrentOwner = async (req, res) => {
  const { productId } = req.body;
  let transits = await contractInstance.getPastEvents("TransitEvent", {
    filter: { productId: [productId] },
    fromBlock: 0,
    toBlock: "latest",
  });
  transits = transits
    .map((el) => ({ logIndex: el.logIndex, ...el.returnValues }))
    .sort((a, b) => a.logIndex - b.logIndex);
  const user = transits[0].transferredTo.toLowerCase();
  let users = await contractInstance.getPastEvents("UserEvent", {
    filter: { userAddress: [user] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (users.length == 0) throw new CustomError("No owner found", 400);
  res.status(200).json({ owner: users[0].returnValues.companyName });
};

const getProductDetails = async (req, res) => {
  const { productAddress, productId } = req.body;
  const products = await contractInstance.getPastEvents("ProductEvent", {
    filter: { productId: [productId] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (products.length == 0) {
    throw new CustomError("No product found matching the criteria", 400);
  }
  res.status(200).json({ product: productName });
};

// edit contract for this
const getProductState = async (req, res) => {
  // change this to use events
  const { contractAddress } = req.body;
  const state = await contractInstance.getProductState(contractAddress);
  res.status(200).json({ state });
};

const getCompanyBranches = async (req, res) => {
  const { companyAddress } = req.body;
  const branches = await contractInstance.getPastEvents("BranchEvent", {
    filter: { _userAddress: [companyAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  // const user = await contractInstance.methods.loginUser("Tesco", "password").call();
  return res.status(200).json(branches);
};

const returnProduct = async (req, res) => {
  const { contractAddress, buyer, sellerAddress } = req.body;
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be returned here", 400);
  await contractInstance.methods.returnProduct(contractAddress, buyer).send({
    from: sellerAddress,
    gas: 3000000,
  });
  res.status(200).json({ message: "Product returned" });
};

const resellProduct = async (req, res) => {
  const { contractAddress, sellerAddress, buyer, newBuyer } = req.body;
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be resold here", 400);
  await contractInstance.resellProduct(contractAddress, buyer, newBuyer).send({
    from: sellerAddress,
    gas: 3000000,
  });
  res.status(200).json({ message: "Successfully transferred property" });
};

const sellProduct = async (req, res) => {
  const { contractAddress, buyer, sellerAddress } = req.body;
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be sold here", 400);
  await contractInstance.sellProduct(contractAddress, buyer).send({
    from: sellerAddress,
    gas: 3000000,
  });
  res.status(200).json({ message: "Successfully finished transaction" });
};

const transferProduct = async (req, res) => {
  const {
    senderAddress,
    destinationAddress,
    contractAddress,
    latitude,
    longitude,
  } = req.body;
  if (
    !accounts.includes(senderAddress.toLowerCase()) ||
    !accounts.includes(destinationAddress.toLowerCase())
  )
    throw new CustomError("Transit party does not exist", 400);
  const contract = await contractInstance.getPastEvents("ProductEvent", {
    filter: { _newContractAddress: [contractAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (contract.length < 1) throw new CustomError("Product does not exist", 400);
  const { productId, productName } = contract[0].returnValues;
  const currentDate = new Date().toISOString();
  const response = await contractInstance.methods
    .transferProduct(
      destinationAddress,
      contractAddress,
      parseInt(productId),
      productName,
      latitude.toString(),
      longitude.toString(),
      currentDate
    )
    .send({
      from: senderAddress,
      gas: 3000000,
    });
  res
    .status(200)
    .json({ message: "Successfully transferred product", response });
};

// api paths

// GET
app.get("/hello", exceptionHandler(hello));
app.get("/accounts", exceptionHandler(getAccounts));
app.get("/product-details", exceptionHandler(getProductDetails));
app.get("/all-products", exceptionHandler(getAllProducts));
app.get("/product-state", exceptionHandler(getProductState));
app.get("/contract-owner", exceptionHandler(getProductCurrentOwner));
app.get("/branches", exceptionHandler(getCompanyBranches));
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
  console.log(err.stack);
  if (err.statusCode) {
    return res.status(err.statusCode).json(writeFeedback(err.message));
  }
  res.status(500).json(writeFeedback(err.message));
});

app.listen(PORT, () => console.log(`NodeJS API is listening on port ${PORT}`));
