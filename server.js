//imports
const express = require("express");
const Web3 = require("web3");
const { check } = require("express-validator");
require("dotenv").config();
const CustomError = require("./utils/CustomError");
const app = express();
const writeFeedback = require("./utils/writeFeedback");
const exceptionHandler = require("./utils/exceptionHandler");
const promisify = require("./utils/promisify");
const authMiddleware = require("./middleware/authMiddleware");
const middlewareExceptionHandler = require("./utils/middlewareExceptionHandler");
const errorCheckerMiddleware = require("./middleware/errorCheckerMiddleware");
const jwt = require("jsonwebtoken");
const config = require("config");
const { test, production } = require("./testingDetails.json");
const { encrypt, decrypt, saltHash, hmacSha } = require("./utils/encryption");
//setting up environment
var web3 =
  process.env.NODE_ENV === "test"
    ? new Web3(test.nodeAddresses[0])
    : new Web3(production.nodeAddresses[0]);

const PORT = process.env.PORT || 5000;

const { abi } = require("./build/contracts/TrackerContract.json");

var contractInstance = new web3.eth.Contract(
  abi,
  process.env.NODE_ENV === "production"
    ? production.contractAddress
    : test.contractAddress
);
// const account = web3.eth.accounts.privateKeyToAccount(
//   "0x43f3ab15b4ce3914e8a292c0781db8c71901a6a939f91704ee0cbc53ce382d75"
// );
// web3.eth.accounts.wallet.add(account);
// web3.eth.defaultAccount = account.address;
let accounts;

// existing roles
const roles = ["manufacturer", "seller", "distributor"];

// initialize accounts
app.use(express.json({ extended: false }));
app.use(express.urlencoded({ extended: false }));

// API functions

const verifyLocation = (latitude, longitude) => {
  return (
    isNaN(latitude) ||
    isNaN(longitude) ||
    parseFloat(latitude) < -90 ||
    parseFloat(latitude) > 90 ||
    parseFloat(longitude) < -180 ||
    parseFloat(longitude) > 180
  );
};

const testCall = async (req, res) => {
  const contract = await contractInstance.getPastEvents("UserEvent", {
    fromBlock: 0,
    toBlock: "latest",
  });
  return res.status(200).json(contract);
};

app.use("/test", exceptionHandler(testCall));

const prepareNode = async (req, res, next) => {
  const { nodeAddress, companyAddress, password } = req.user;
  web3 = new Web3(new Web3.providers.HttpProvider(nodeAddress));
  contractInstance = new web3.eth.Contract(
    abi,
    process.env.NODE_ENV === "production"
      ? production.contractAddress
      : test.contractAddress
  );
  accounts = await promisify(web3.eth.getAccounts);
  accounts = accounts.map((el) => el.toLowerCase());
  if (process.env.NODE_ENV === "production") {
    const res = await web3.eth.personal.unlockAccount(
      companyAddress,
      password,
      100000
    );
    web3.eth.defaultAccount = companyAddress;
  } else {
    web3.eth.defaultAccount = accounts[0];
  }
  next();
};

const createUser = async (req, res) => {
  let { userToCreateAddress, name, role } = req.body;
  const { companyAddress: senderAddress } = req.user;
  if (!accounts.includes(senderAddress.toLowerCase()))
    throw new CustomError("Invalid account address", 400);
  role = role.toLowerCase();
  password = await saltHash(password);
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
  const dateAdded = new Date();
  let stringDate =
    dateAdded.toLocaleDateString() + " at " + dateAdded.toLocaleTimeString();
  await contractInstance.methods
    .addUser(userToCreateAddress, name, role, stringDate)
    .send({
      gas: 3000000,
    });
  res
    .status(201)
    .json({ success: "Successfully added new " + (role ? role : "User") });
};

const findAccountExists = async (val) => {
  let users = val.startsWith("0x")
    ? await contractInstance.getPastEvents("UserEvent", {
        filter: {
          userAddress: [val],
        },
        fromBlock: 0,
        toBlock: "latest",
      })
    : await contractInstance.getPastEvents("UserEvent", {
        fromBlock: 0,
        toBlock: "latest",
      });
  return val.startsWith("0x")
    ? users.length === 1
      ? users[0]
      : undefined
    : users.find((el) => el.returnValues.companyName === val);
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
  const { companyAddress: senderAddress, role } = req.user;
  if (parseInt(role) !== 0)
    throw new CustomError("Only manufacturers can perform this action", 401);
  if (!linkToMerch) linkToMerch = "Not available";
  if (!accounts.includes(senderAddress.toLowerCase()))
    throw new CustomError("Invalid account address", 400);
  if (verifyLocation(latitude, longitude)) {
    throw new CustomError(
      "Invalid location details, please check that location is enabled and permissions granted",
      400
    );
  }
  let foundUser = await findAccountExists(sellerName || sellerAddress);
  if (foundUser) sellerAddress = foundUser.returnValues.userAddress;
  else throw new CustomError("Seller account does not exist", 400);

  const dateAdded = new Date();
  let currentDate =
    dateAdded.toLocaleDateString() + " at " + dateAdded.toLocaleTimeString();
  const resp = await contractInstance.methods
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
  const {
    events: { ProductEvent },
  } = resp;
  res.status(201).json({
    ...ProductEvent.returnValues,
    productQR: encrypt(ProductEvent.returnValues.productContractAddress),
    productNFC: encrypt(ProductEvent.returnValues.productId),
  });
};

const getAllProducts = async (req, res) => {
  const { companyAddress, role } = req.user;
  if (!accounts.includes(companyAddress.toLowerCase()))
    throw new CustomError("Invalid account address", 400);
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

const getProductCurrentOwner = async (req, res) => {
  let { product: productAddress } = req.query;
  productAddress = decrypt(productAddress);
  let products = await contractInstance.getPastEvents("ProductEvent", {
    filter: { productContractAddress: [productAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (products.length == 0) {
    throw new CustomError("Product does not exist in our records", 400);
  }
  const ownerAddress = await contractInstance.methods
    .getProductCurrentOwner(productAddress)
    .call({
      from: req.user.companyAddress,
      gas: 3000000,
    });
  const [
    {
      returnValues: { companyName },
    },
  ] = await contractInstance.getPastEvents("UserEvent", {
    filter: { userAddress: [ownerAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  res.status(200).json({ owner: companyName });
};

const getProductSeller = async (req, res) => {
  let { product: productAddress } = req.query;
  productAddress = decrypt(productAddress);
  let products = await contractInstance.getPastEvents("ProductEvent", {
    filter: { productContractAddress: [productAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (products.length == 0) {
    throw new CustomError("Product does not exist in our records", 400);
  }
  const sellerAddress = await contractInstance.methods
    .getProductSeller(productAddress)
    .call({
      from: req.user.companyAddress,
      gas: 3000000,
    });
  const [
    {
      returnValues: { companyName },
    },
  ] = await contractInstance.getPastEvents("UserEvent", {
    filter: { userAddress: [sellerAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  res.status(200).json({ seller: companyName });
};

const getProductById = async (req, res) => {
  let { productId } = req.body;

  let products = await contractInstance.getPastEvents("ProductEvent", {
    filter: { productId: [parseInt(productId)] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (products.length < 1) throw new CustomError("Product not found", 400);
  let transits = await contractInstance.getPastEvents("TransitEvent", {
    filter: { productId: [parseInt(productId)] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (transits.length == 0) {
    throw new CustomError("Product does not exist in our records", 400);
  }

  res.status(200).json({
    product: products[0].returnValues,
    transits: transits.map((el) => el.returnValues),
  });
};

const getProductDetails = async (req, res) => {
  let { product: productAddress } = req.query;
  if (
    !productAddress.includes(":") ||
    productAddress.split(":")[0].length < 15
  ) {
    throw new CustomError("Product does not exist", 400);
  }
  try {
    productAddress = decrypt(productAddress);
  } catch (error) {
    throw new CustomError("Product does not exist", 400);
  }
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
  return res.status(200).json({ branches });
};

const login = async (req, res) => {
  let { username, password, nodeAddress } = req.body;

  if (
    process.env.NODE_ENV === "production" &&
    !production.nodeAddresses.includes(nodeAddress)
  )
    throw new CustomError("The node address entered is invalid", 400);
  else nodeAddress = test.nodeAddresses[0];

  if (process.env.NODE_ENV === "test")
    web3.eth.Contract.defaultAccount =
      "0xbEEBc172694c0f55eC41Efb36f1a85aEcE3C46E2";

  let resp, unlockSuccess;
  // if (process.env.NODE_ENV === "production") {
  //   unlockSuccess = await web3.eth.personal.unlockAccount(
  //     mainAccount, // account to unlock on main node
  //     password,
  //     15000
  //   );
  // }
  // if (!unlockSuccess) throw new CustomError("Action failed, please try again");
  resp = await findAccountExists(username);
  if (resp === undefined) throw new CustomError("Invalid account or password");
  const user = {
    companyAddress: resp.returnValues.userAddress,
    disabled: !!resp.returnValues.disabled,
    role:
      resp.returnValues.role === "manufacturer"
        ? 0
        : resp.returnValues.role === "distributor"
        ? 2
        : 1,
    companyName: username,
    nodeAddress: nodeAddress,
    password: password,
  };
  const payload = {
    user,
  };

  let token = jwt.sign(payload, config.get("jwtSecret"), {
    expiresIn: 60000,
  });
  token = encrypt(token);
  delete user.password;
  res.status(200).json({
    token,
    user,
  });
};

const returnProduct = async (req, res) => {
  let { productNFC, productQR, buyer, latitude, longitude } = req.body;
  const { companyAddress: sellerAddress, role } = req.user;
  try {
    productNFC = decrypt(productNFC);
    productQR = decrypt(productQR);
  } catch (error) {
    throw new CustomError("Product does not exist", 400);
  }
  if (role !== 1)
    throw new CustomError(
      "Sell/Resell/Return actions can only be performed by sellers",
      400
    );
  buyer = hmacSha(buyer);
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be returned here", 400);

  await contractInstance.methods.returnProduct(productQR, buyer).send({
    from: sellerAddress,
    gas: 3000000,
  });
  res.status(200).json({ message: "Product returned" });
};

const resellProduct = async (req, res) => {
  let {
    productNFC,
    productQR,
    buyer,
    newBuyer,
    latitude,
    longitude,
  } = req.body;
  const { companyAddress: sellerAddress, role } = req.user;
  try {
    productNFC = decrypt(productNFC);
    productQR = decrypt(productQR);
  } catch (error) {
    throw new CustomError("Product does not exist", 400);
  }
  if (role !== 1)
    throw new CustomError(
      "Sell/Resell/Return actions can only be performed by sellers",
      400
    );
  buyer = hmacSha(buyer);
  newBuyer = hmacSha(newBuyer);
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be resold here", 400);
  await contractInstance.methods
    .resellProduct(productQR, buyer, newBuyer)
    .send({
      from: sellerAddress,
      gas: 3000000,
    });
  res.status(200).json({ message: "Successfully transferred property" });
};

const sellProduct = async (req, res) => {
  let { productNFC, productQR, buyer, latitude, longitude } = req.body;
  const { companyAddress: sellerAddress, role } = req.user;
  try {
    productNFC = decrypt(productNFC);
    productQR = decrypt(productQR);
  } catch (error) {
    throw new CustomError("Product does not exist", 400);
  }
  if (role !== 1)
    throw new CustomError(
      "Sell/Resell/Return actions can only be performed by sellers",
      400
    );
  buyer = hmacSha(buyer);
  if (!accounts.includes(sellerAddress.toLowerCase()))
    throw new CustomError("Product cannot be sold here", 400);
  await contractInstance.methods.sellProduct(productQR, buyer).send({
    from: sellerAddress,
    gas: 3000000,
  });
  res.status(200).json({ message: "Congrats! You just acquired this item." });
};

const transferProduct = async (req, res) => {
  let { destinationAddress, productAddress, latitude, longitude } = req.body;
  if (
    !productAddress.includes(":") ||
    productAddress.split(":")[0].length < 15
  ) {
    throw new CustomError("Product does not exist", 400);
  }
  try {
    productAddress = decrypt(productAddress);
  } catch (error) {
    throw new CustomError("Product does not exist", 400);
  }
  const { companyAddress: senderAddress } = req.user;
  if (typeof latitude !== "string") latitude = latitude.toString();
  if (typeof longitude !== "string") longitude = longitude.toString();
  if (verifyLocation(latitude, longitude)) {
    throw new CustomError(
      "Invalid location details, please check that location is active and permissions are granted to the app",
      400
    );
  }
  if (!accounts.includes(senderAddress.toLowerCase()))
    throw new CustomError("Invalid account used for transfer", 400);
  const foundUser = await findAccountExists(destinationAddress);
  if (!foundUser)
    throw new CustomError("Transit party does not exist in the system", 400);
  const contract = await contractInstance.getPastEvents("ProductEvent", {
    filter: { productContractAddress: [productAddress] },
    fromBlock: 0,
    toBlock: "latest",
  });
  if (contract.length < 1) throw new CustomError("Product does not exist", 400);
  const { productId, productName } = contract[0].returnValues;
  const dateAdded = new Date();
  let currentDate =
    dateAdded.toLocaleDateString() + " at " + dateAdded.toLocaleTimeString();
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
app.get("/product-details", exceptionHandler(getProductDetails));
app.get("/all-products", [authMiddleware], exceptionHandler(getAllProducts));
app.get(
  "/product-owner",
  [authMiddleware, middlewareExceptionHandler(prepareNode)],
  exceptionHandler(getProductCurrentOwner)
);
app.get(
  "/product-seller",
  [authMiddleware, middlewareExceptionHandler(prepareNode)],
  exceptionHandler(getProductSeller)
);
app.get("/branches", authMiddleware, exceptionHandler(getCompanyBranches));
// POST
app.post(
  "/add-user",
  [authMiddleware, middlewareExceptionHandler(prepareNode)],
  exceptionHandler(createUser)
);
app.post(
  "/product-details",
  [authMiddleware, middlewareExceptionHandler(prepareNode)],
  exceptionHandler(getProductById)
);
app.post("/login", exceptionHandler(login));
app.post(
  "/add-contract",
  [
    check("productName", "product name must be provided").exists(),
    check("latitude", "location latitude must be provided").exists(),
    check("longitude", "location longitude must be provided").exists(),
    check("x-auth-token", "an authorization token must be provided").exists(),
    errorCheckerMiddleware,
    authMiddleware,
    middlewareExceptionHandler(prepareNode),
  ],
  exceptionHandler(createProductContract)
);
app.post(
  "/transfer-product",
  [authMiddleware, middlewareExceptionHandler(prepareNode)],
  exceptionHandler(transferProduct)
);
app.post(
  "/return-product",
  [
    check("productQR", "A valid QR code must be provided")
      .exists()
      .isLength({ min: 30 }),
    check("productNFC", "A valid NFC scan result must be provided")
      .exists()
      .isLength({ min: 30 }),
    check("buyer", "A buyer secure memorable code must be provided")
      .exists()
      .isLength({ min: 8 }),
    check("x-auth-token", "an authorization token must be provided").exists(),
    errorCheckerMiddleware,
    authMiddleware,
    middlewareExceptionHandler(prepareNode),
  ],
  exceptionHandler(returnProduct)
);
app.post(
  "/resell-product",
  [
    check("productQR", "A valid QR code must be provided")
      .exists()
      .isLength({ min: 30 }),
    check("productNFC", "A valid NFC scan result must be provided")
      .exists()
      .isLength({ min: 30 }),
    check("buyer", "A buyer secure memorable code must be provided")
      .exists()
      .isLength({ min: 8 }),
    check("newBuyer", "A new memorable code for new owner must be provided")
      .exists()
      .isLength({ min: 8 }),
    check("x-auth-token", "an authorization token must be provided").exists(),
    errorCheckerMiddleware,
    authMiddleware,
    middlewareExceptionHandler(prepareNode),
  ],
  exceptionHandler(resellProduct)
);
app.post(
  "/sell-product",
  [
    check("productQR", "A QR code must be provided")
      .exists()
      .isLength({ min: 30 }),
    check("productNFC", "An NFC scan result must be provided")
      .exists()
      .isLength({ min: 30 }),
    check("buyer", "A buyer memorable code must be provided")
      .exists()
      .isLength({ min: 8 }),
    check("x-auth-token", "an authorization token must be provided").exists(),
    errorCheckerMiddleware,
    authMiddleware,
    middlewareExceptionHandler(prepareNode),
  ],
  exceptionHandler(sellProduct)
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
    err.statusCode = 400;
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

module.exports = { app };
