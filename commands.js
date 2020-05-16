// let user = await con.addUser("accountAddress", "name", "password", "role")
// roles: manufacturer, distributor, seller
const parsedJSON = require("./buildDataProd.json");

const dateAdded = new Date();
let stringDate =
  dateAdded.toLocaleDateString() + " at " + dateAdded.toLocaleTimeString();
async function addUsers(con) {
  const all = await Promise.all(
    parsedJSON.map(async (el) => {
      const user = await con.addUser(...el, stringDate);
      return user;
    })
  );
  return true;
}

async function addBranches(con) {
  let newBranch = await con.addBranch(
    "Madalin's Home",
    "51.49233",
    "-0.02048",
    dateAdded,
    {
      from: "0x464000e9Aba52533Ef3ebdd2223a2a74f319D665",
    }
  );
  newBranch = await con.addBranch(
    "Madalin's Home",
    "51.49233",
    "-0.02048",
    dateAdded,
    {
      from: "0x9b309f192E8225Cf39eBB631f975c13C60F3E57E",
    }
  );
  return true;
}

module.exports = { addUsers, addBranches };
