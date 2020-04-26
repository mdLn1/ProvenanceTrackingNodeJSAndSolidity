// let user = await con.addUser("accountAddress", "name", "password", "role")
// roles: manufacturer, distributor, seller
const dateAdded = new Date().toISOString();
const parsedJSON = require("./buildData.json");

async function addUsers(con) {
  const all = await Promise.all(
    parsedJSON.map(async (el) => {
      const user = await con.addUser(...el, dateAdded);
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
      from: "0x2ce06C0028fC4DB7E923aE630aC614fA677260a7",
    }
  );
  newBranch = await con.addBranch(
    "Madalin's Home",
    "51.49233",
    "-0.02048",
    dateAdded,
    {
      from: "0x7B69Af132D1FA62654aCAbb53633B373953758FF",
    }
  );
  return true;
}

module.exports = { addUsers, addBranches };
