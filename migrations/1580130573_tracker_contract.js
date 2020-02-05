var TrackerContract = artifacts.require('TrackerContract');
 
module.exports = function(deployer) {
  // Use deployer to state migration tasks.
  deployer.deploy(TrackerContract);
};