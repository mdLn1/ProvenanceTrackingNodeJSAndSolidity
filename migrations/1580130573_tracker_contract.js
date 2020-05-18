var TrackerContract = artifacts.require("TrackerContract");

module.exports = function (deployer, network, accounts) {
  // Use deployer to state migration tasks.
  const dateAdded = new Date();
  let stringDate =
    dateAdded.toLocaleDateString() + " at " + dateAdded.toLocaleTimeString();
  deployer.deploy(
    TrackerContract,
    "Adidas",
    "manufacturer",
    stringDate,
    {
      from: accounts[0],
    }
  );
};
