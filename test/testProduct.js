const expect = require("expect");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const config = require("config");
const { encrypt } = require("../utils/encryption");
const { app } = require("../server");
let manufacturerToken = jwt.sign(
  {
    user: {
      companyAddress: "0x0089197926f033879C30658504FbE0AF27cf0478",
      role: 0,
    },
  },
  config.get("jwtSecret"),
  {
    expiresIn: 60000,
  }
);
let distributorToken = jwt.sign(
  {
    user: {
      companyAddress: "0x5447246e41947A772fCFE26ED554fBa5F196BCB9",
      role: 2,
    },
  },
  config.get("jwtSecret"),
  {
    expiresIn: 60000,
  }
);
let sellerToken = jwt.sign(
  {
    user: {
      companyAddress: "0xc28832fA1C02037A81bb5D543Ee4d1fae95dcbf4",
      role: 1,
    },
  },
  config.get("jwtSecret"),
  {
    expiresIn: 60000,
  }
);

manufacturerToken = encrypt(manufacturerToken);
sellerToken = encrypt(sellerToken);
distributorToken = encrypt(distributorToken);

// Create Product Provenance contract
describe("POST /add-contract/", () => {
  it("It should return an array of errors as no fields data is provided", (done) => {
    request(app)
      .post("/add-contract")
      .set({ "x-auth-token": manufacturerToken })
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });

  it("It should return 401 as invalid token is provided", (done) => {
    request(app)
      .post("/add-contract")
      .set({ "x-auth-token": "" })
      .send({
        productName: "shoe",
        latitude: "52.0333",
        longitude: "-1.3213",
        sellerName: "Tesco",
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });

  it("It should return 400 as not all the required fields were sent", (done) => {
    request(app)
      .post("/add-contract")
      .set({ "x-auth-token": manufacturerToken })
      .send({
        productName: "shoe",
        latitude: "52.0333",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });

  it("It should return 401 as distributors/sellers cannot add products to the blockchain", (done) => {
    request(app)
      .post("/add-contract")
      .set({ "x-auth-token": distributorToken })
      .send({
        productName: "shoe",
        latitude: "52.0333",
        longitude: "-1.3213",
        sellerName: "Tesco",
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });

  it("It should return 400 as the seller provided does not exist", (done) => {
    request(app)
      .post("/add-contract")
      .set({ "x-auth-token": manufacturerToken })
      .send({
        productName: "shoe",
        latitude: "52.0333",
        longitude: "-1.3213",
        sellerName: "random",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });

  it("It should return 400 as location data is invalid", (done) => {
    request(app)
      .post("/add-contract")
      .set({ "x-auth-token": manufacturerToken })
      .send({
        productName: "shoe",
        latitude: 10231.0,
        longitude: 2321.2,
        sellerName: "random",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });

  it("It should return 201 as data provided is complete", (done) => {
    request(app)
      .post("/add-contract")
      .set({ "x-auth-token": manufacturerToken })
      .send({
        productName: "shoe",
        latitude: "52.0333",
        longitude: "-1.3213",
        sellerName: "Tesco",
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.productQR).toBeDefined();
        expect(res.body.productNFC).toBeDefined();
      })
      .end(done);
  });
});

// Retrieve product details
describe("POST /product-details/", () => {
  it("existing product, it should return its details", (done) => {
    request(app)
      .get(
        "/product-details/?product=c592a18d5c0a80b155a522248c8e1dd4:36788fa416fc90b6f4466537f698513b1dd73db8d3939bf7140c1bb788c43737eac5f718ffb8cdb1b5fa4ed2f98cd4a8"
      )
      .send({})
      .expect(200)
      .expect((res) => {
        expect(res.body.product).toBeInstanceOf(Object);
        expect(res.body.transits).toBeInstanceOf(Array);
      })
      .end(done);
  });

  it("product does not exists, errors should be retrieved", (done) => {
    request(app)
      .get(
        "/product-details/?product=c592a18d5c0a80b155a522248c8e1dd4:36788fa416fc90b6f4466537f698513b1dd73db8d3939bf7140c1bb788c43737eac5f718ffb8cdb1b5fa42f98cd4a8"
      )
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
});

// sell/resell/return product actions are difficult to test as this information changes during tests
// once a sell/resell/return executed successfully second time it will not work since the action took place already
// therefore the tests are conducted to always fail due to validation reasons
// since the actions are related, test cases are similar
describe("POST /sell-product/ & /resell-product/ & /return-product", () => {
  it("SELL: no parameters provided, errors should be returned", (done) => {
    request(app)
      .post("/sell-product/")
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("SELL: other roles than seller cannot make sales", (done) => {
    request(app)
      .post("/sell-product/")
      .set({ "x-auth-token": manufacturerToken })
      .send({
        productQR:
          "c592a18d5c0a80b155a522248c8e1dd4:36788fa416fc90b6f4466537f698513b1dd73db8d3939bf7140c1bb788c43737eac5f718ffb8cdb1b5fa4ed2f98cd4a8",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("SELL: non-existing product, sale cannot be made", (done) => {
    request(app)
      .post("/sell-product/")
      .set({ "x-auth-token": sellerToken })
      .send({
        productQR:
          "84c1f1a7d2868850440c76595494c925:ffd3f80b7877c604d3e9c460a212e9cc009ee3cf3629d99949e1851953ce811516374b780eb0201930c7e737b020",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("SELL: product not in shop, sale cannot take place", (done) => {
    request(app)
      .post("/sell-product/")
      .set({ "x-auth-token": sellerToken })
      .send({
        productQR:
          "c592a18d5c0a80b155a522248c8e1dd4:36788fa416fc90b6f4466537f698513b1dd73db8d3939bf7140c1bb788c43737eac5f718ffb8cdb1b5fa4ed2f98cd4a8",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("RESELL: no parameters provided, errors should be returned", (done) => {
    request(app)
      .post("/resell-product/")
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("RESELL: other roles than seller cannot resell", (done) => {
    request(app)
      .post("/resell-product/")
      .set({ "x-auth-token": manufacturerToken })
      .send({
        productQR:
          "c592a18d5c0a80b155a522248c8e1dd4:36788fa416fc90b6f4466537f698513b1dd73db8d3939bf7140c1bb788c43737eac5f718ffb8cdb1b5fa4ed2f98cd4a8",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
        newBuyer: "newSecretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("RESELL: non-existing product, resell cannot be made", (done) => {
    request(app)
      .post("/resell-product/")
      .set({ "x-auth-token": sellerToken })
      .send({
        productQR:
          "84c1f1a7d2868850440c76595494c925:ffd3f80b7877c604d3e9c460a212e9cc009ee3cf3629d99949e1851953ce811516374b780eb0201930c7e737b020",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
        newBuyer: "newSecretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("RESELL: product not sold, no resell can be done", (done) => {
    request(app)
      .post("/resell-product/")
      .set({ "x-auth-token": sellerToken })
      .send({
        productQR:
          "c592a18d5c0a80b155a522248c8e1dd4:36788fa416fc90b6f4466537f698513b1dd73db8d3939bf7140c1bb788c43737eac5f718ffb8cdb1b5fa4ed2f98cd4a8",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
        newBuyer: "newSecretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("RETURN: no parameters provided, errors should be returned", (done) => {
    request(app)
      .post("/return-product/")
      .send({})
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("RETURN: other roles than seller cannot return", (done) => {
    request(app)
      .post("/return-product/")
      .set({ "x-auth-token": manufacturerToken })
      .send({
        productQR:
          "c592a18d5c0a80b155a522248c8e1dd4:36788fa416fc90b6f4466537f698513b1dd73db8d3939bf7140c1bb788c43737eac5f718ffb8cdb1b5fa4ed2f98cd4a8",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("RETURN: non-existing product, return cannot be made", (done) => {
    request(app)
      .post("/return-product/")
      .set({ "x-auth-token": sellerToken })
      .send({
        productQR:
          "84c1f1a7d2868850440c76595494c925:ffd3f80b7877c604d3e9c460a212e9cc009ee3cf3629d99949e1851953ce811516374b780eb0201930c7e737b020",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
  it("RETURN: product not sold, no return can be done", (done) => {
    request(app)
      .post("/resell-product/")
      .set({ "x-auth-token": sellerToken })
      .send({
        productQR:
          "c592a18d5c0a80b155a522248c8e1dd4:36788fa416fc90b6f4466537f698513b1dd73db8d3939bf7140c1bb788c43737eac5f718ffb8cdb1b5fa4ed2f98cd4a8",
        productNFC:
          "27d8f0abb9666069c1a1610ea28b71ff:82a48be1f1e38e1ffeb9a1c7217bfe0a",
        buyer: "secretBuyer",
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.errors).toBeInstanceOf(Array);
      })
      .end(done);
  });
});
