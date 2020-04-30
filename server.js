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
const authMiddleware = require("./middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const config = require("config");
//setting up environment
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCAL_NODE));
const PORT = process.env.PORT || 5000;
const abi = JSON.parse(
  '[{"inputs": [],"payable": false,"stateMutability": "nonpayable","type": "constructor"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "companyAddress","type": "address"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "string","name": "branchName","type": "string"},{"indexed": false,"internalType": "string","name": "latitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "longitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "BranchEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "productContractAddress","type": "address"},{"indexed": true,"internalType": "address","name": "manufacturerAddress","type": "address"},{"indexed": true,"internalType": "uint256","name": "productId","type": "uint256"},{"indexed": false,"internalType": "string","name": "manufacturerName","type": "string"},{"indexed": false,"internalType": "string","name": "productName","type": "string"},{"indexed": false,"internalType": "string","name": "linkToMerch","type": "string"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "ProductEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "transferredTo","type": "address"},{"indexed": true,"internalType": "uint256","name": "productId","type": "uint256"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "string","name": "productName","type": "string"},{"indexed": false,"internalType": "string","name": "latitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "longitudeLocation","type": "string"},{"indexed": false,"internalType": "string","name": "dateTransferred","type": "string"}],"name": "TransitEvent","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"internalType": "address","name": "userAddress","type": "address"},{"indexed": false,"internalType": "string","name": "companyName","type": "string"},{"indexed": false,"internalType": "bool","name": "companyDisabled","type": "bool"},{"indexed": false,"internalType": "string","name": "dateAdded","type": "string"}],"name": "UserEvent","type": "event"},{"constant": true,"inputs": [{"internalType": "string","name": "_name","type": "string"},{"internalType": "string","name": "_password","type": "string"}],"name": "loginUser","outputs": [{"internalType": "address","name": "companyAddress","type": "address"},{"internalType": "bool","name": "disabled","type": "bool"},{"internalType": "enum TrackerContract.RoleType","name": "role","type": "uint8"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_seller","type": "address"},{"internalType": "string","name": "_productName","type": "string"},{"internalType": "string","name": "_linkToMerch","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "createProvenanceContract","outputs": [{"internalType": "uint256","name": "newProductId","type": "uint256"},{"internalType": "string","name": "company","type": "string"}],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_accountAddress","type": "address"},{"internalType": "string","name": "_name","type": "string"},{"internalType": "string","name": "_password","type": "string"},{"internalType": "string","name": "_role","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "addUser","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "string","name": "_branchName","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateAdded","type": "string"}],"name": "addBranch","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_newParty","type": "address"},{"internalType": "address","name": "_contract","type": "address"},{"internalType": "uint256","name": "_productId","type": "uint256"},{"internalType": "string","name": "productName","type": "string"},{"internalType": "string","name": "_latitudeLocation","type": "string"},{"internalType": "string","name": "_longitudeLocation","type": "string"},{"internalType": "string","name": "_dateTransferred","type": "string"}],"name": "transferProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"}],"name": "returnProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"},{"internalType": "string","name": "_newBuyer","type": "string"}],"name": "resellProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_buyer","type": "string"}],"name": "sellProduct","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [{"internalType": "address","name": "_contract","type": "address"},{"internalType": "string","name": "_productName","type": "string"}],"name": "changeProductDetails","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": true,"inputs": [{"internalType": "address","name": "_contract","type": "address"}],"name": "getProductCurrentOwner","outputs": [{"internalType": "address","name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"}]'
);
var contractInstance = new web3.eth.Contract(
  abi,
  "0x34651197d094905fBD7EF207063ACA4FA9cb69Db"
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
app.use(express.urlencoded({ extended: false }));
app.use(initAccounts);

// API functions

const hello = (req, res) => {
  throw new CustomError("error hello");
  res.status(400).json({ message: "hello" });
};

const test = async (req, res) => {
  const contract = await contractInstance.getPastEvents("ProductEvent", {
    filter: {
      _newContractAddress: ["0x34651197d094905fBD7EF207063ACA4FA9cb69Db"],
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
  let {
    sellerAddress,
    sellerName,
    productName,
    linkToMerch,
    latitude,
    longitude,
  } = req.body;
  const { companyAddress: senderAddress } = req.user;
  if (
    isNaN(latitude) ||
    isNaN(longitude) ||
    parseFloat(latitude) < -90 ||
    parseFloat(latitude) > 90 ||
    parseFloat(longitude) < -180 ||
    parseFloat(longitude) > 180
  ) {
    throw new CustomError("Invalid location details", 400);
  }
  if (!linkToMerch) linkToMerch = "Not available";
  if (!accounts.includes(senderAddress.toLowerCase()))
    throw new CustomError("Invalid sender account address", 400);
  if (sellerName) {
    let users = await contractInstance.getPastEvents("UserEvent", {
      fromBlock: 0,
      toBlock: "latest",
    });
    let foundUser = users.find(
      (el) => el.returnValues.companyName === sellerName
    );
    if (foundUser) sellerAddress = foundUser.returnValues.userAddress;
  }
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Invalid seller account address", 400);
  const currentDate = new Date().toISOString();

  const {
    events: { ProductEvent },
  } = await contractInstance.methods
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
  res.status(201).json({
    ...ProductEvent.returnValues,
    productQR: encrypt(ProductEvent.returnValues.productContractAddress),
    productNFC: encrypt(ProductEvent.returnValues.productId),
  });
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
  const { companyAddress, role } = req.user;
  if (!accounts.includes(companyAddress.toLowerCase()))
    throw new CustomError("Account does not exist", 400);
  let products = [];
  if (role == 1 || role == 2) {
    products = [];
  } else {
    products = await contractInstance.getPastEvents("ProductEvent", {
      filter: { manufacturerAddress: [companyAddress] },
      fromBlock: 0,
      toBlock: "latest",
    });
  }
  res
    .status(200)
    .json({ products: products.map((el) => ({ ...el.returnValues })) });
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
  if (transits.length == 0) {
    throw new CustomError("Product does not exist in our records", 400);
  }
  // transits = transits
  //   .map((el) => ({
  //     ...el.returnValues,
  //     dateEdited: new Date(el.returnValues.dateTransferred),
  //   }))
  //   .sort((a, b) => b.dateEdited - a.dateEdited)
  //   .map((el) => {
  //     delete el.dateEdited;
  //     return el;
  //   });
  transits = transits.reverse();
  res.status(200).json({ owner: transits[0].companyName });
};

const getProductDetails = async (req, res) => {
  let { product: productAddress } = req.query;
  productAddress = decrypt(productAddress);
  let products = await contractInstance.getPastEvents("ProductEvent", {
    filter: { productContractAddress: [productAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (products.length < 1) throw new CustomError("Product not found", 400);
  let transits = await contractInstance.getPastEvents("TransitEvent", {
    filter: { productId: [parseInt(products[0].returnValues.productId)] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (transits.length == 0) {
    throw new CustomError("Product does not exist in our records", 400);
  }
  // transits = transits
  //   .map((el) => ({
  //     ...el.returnValues,
  //     dateEdited: new Date(el.returnValues.dateTransferred),
  //   }))
  //   .sort((a, b) => b.dateEdited - a.dateEdited)
  //   .map((el) => {
  //     delete el.dateEdited;
  //     return el;
  //   });
  res.status(200).json({
    product: products[0].returnValues,
    transits: transits.map((el) => el.returnValues),
  });
};

const getCompanyBranches = async (req, res) => {
  const { companyAddress } = req.body;
  const branches = await contractInstance.getPastEvents("BranchEvent", {
    filter: { _userAddress: [companyAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  // const user = await contractInstance.methods.loginUser("Tesco", "password").call();
  return res.status(200).json({ branches });
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const resp = await contractInstance.methods
    .loginUser(username, password)
    .call({
      from: accounts[0],
      gas: 3000000,
    });
  const user = {
    companyAddress: resp.companyAddress,
    disabled: resp.disabled,
    role: parseInt(resp.role),
    companyName: username,
  };
  const payload = {
    user,
  };
  const token = jwt.sign(payload, config.get("jwtSecret"), {
    expiresIn: 60000,
  });
  res.status(200).json({
    token,
    user,
  });
};

const returnProduct = async (req, res) => {
  let { productNFC, productQR, buyer } = req.body;
  const { companyAddress: sellerAddress } = req.user;
  productNFC = decrypt(productNFC);
  productQR = decrypt(productQR);
  buyer = encrypt(buyer);
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be returned here", 400);
  await contractInstance.methods.returnProduct(contractAddress, buyer).send({
    from: sellerAddress,
    gas: 3000000,
  });
  res.status(200).json({ message: "Product returned" });
};

const resellProduct = async (req, res) => {
  let { productNFC, productQR, buyer, newBuyer } = req.body;
  const { companyAddress: sellerAddress } = req.user;
  productNFC = decrypt(productNFC);
  productQR = decrypt(productQR);
  buyer = encrypt(buyer);
  newBuyer = encrypt(newBuyer);
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be resold here", 400);
  await contractInstance.resellProduct(contractAddress, buyer, newBuyer).send({
    from: sellerAddress,
    gas: 3000000,
  });
  res.status(200).json({ message: "Successfully transferred property" });
};

const sellProduct = async (req, res) => {
  let { productNFC, productQR, buyer } = req.body;
  const { companyAddress: sellerAddress } = req.user;
  productNFC = decrypt(productNFC);
  productQR = decrypt(productQR);
  buyer = encrypt(buyer);
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be sold here", 400);
  await contractInstance.sellProduct(contractAddress, buyer).send({
    from: sellerAddress,
    gas: 3000000,
  });
  res.status(200).json({ message: "Successfully effectuated transaction" });
};

const transferProduct = async (req, res) => {
  let { destinationAddress, productAddress, latitude, longitude } = req.body;
  productAddress = decrypt(productAddress);
  const { companyAddress: senderAddress } = req.user;
  if (typeof latitude !== "string") latitude = latitude.toString();
  if (typeof longitude !== "string") longitude = longitude.toString();
  if (
    isNaN(latitude) ||
    isNaN(longitude) ||
    parseFloat(latitude) < -90 ||
    parseFloat(latitude) > 90 ||
    parseFloat(longitude) < -180 ||
    parseFloat(longitude) > 180
  ) {
    throw new CustomError("Invalid location details", 400);
  }
  if (
    !accounts.includes(senderAddress.toLowerCase()) ||
    !accounts.includes(destinationAddress.toLowerCase())
  )
    throw new CustomError("Transit party does not exist", 400);
  const contract = await contractInstance.getPastEvents("ProductEvent", {
    filter: { productContractAddress: [productAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (contract.length < 1) throw new CustomError("Product does not exist", 400);
  const { productId, productName } = contract[0].returnValues;
  const currentDate = new Date().toISOString();
  const response = await contractInstance.methods
    .transferProduct(
      destinationAddress,
      productAddress,
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
  res.status(200).json({
    message: "Successfully transferred product",
    transit: { ...response.events.TransitEvent.returnValues },
  });
};

// api paths

// GET
app.use("/hello", hello);
app.get("/accounts", authMiddleware, exceptionHandler(getAccounts));
app.get("/product-details", exceptionHandler(getProductDetails));
app.get("/all-products", authMiddleware, exceptionHandler(getAllProducts));
app.get("/product-owner", exceptionHandler(getProductCurrentOwner));
app.get("/branches", authMiddleware, exceptionHandler(getCompanyBranches));
// POST
app.post("/add-user", authMiddleware, exceptionHandler(createUser));
app.post("/login", exceptionHandler(login));
app.post(
  "/add-contract",
  authMiddleware,
  exceptionHandler(createProductContract)
);
app.post(
  "/transfer-product",
  authMiddleware,
  exceptionHandler(transferProduct)
);
app.post("/return-product", authMiddleware, exceptionHandler(returnProduct));
app.post("/resell-product", authMiddleware, exceptionHandler(resellProduct));
app.post("/sell-product", authMiddleware, exceptionHandler(sellProduct));
app.post(
  "/edit-product",
  authMiddleware,
  exceptionHandler(changeProductDetails)
);

// Handling pages not found
app.use((req, res, next) => {
  res.status(404).send({ feedback: writeFeedback("Resource not found") });
});

// Global error handling through middleware
app.use((err, req, res, next) => {
  console.log(err.stack);
  if (err.message.includes("revert")) {
    err.message = err.message.split("revert ")[1];
  }
  if (err.message.includes("invalid string value ")) {
    let str = err.message.split("_")[1];
    str = str.substring(0, str.indexOf('"'));
    err.message = str + "invalid value";
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json(writeFeedback(err.message));
  }
  res.status(500).json(writeFeedback(err.message));
});

app.listen(PORT, () => console.log(`NodeJS API is listening on port ${PORT}`));
