// let user = await con.addUser("accountAddress", "name", "password", "role")
// roles: manufacturer, distributor, seller
const dateAdded = new Date().toISOString();
async function addUsers(con) {
  let user = await con.addUser(
    "0x95bEc0f0067DBdd06Ad791440B77f80F7943D66d",
    "Nike",
    "password",
    "manufacturer",
    dateAdded
  );
  user = await con.addUser(
    "0x85431A1a000E02C4546Dab4364b15b5e20A7008b",
    "Adidas",
    "password",
    "manufacturer",
    dateAdded
  );
  user = await con.addUser(
    "0xB3DC0e9F140C06e4188F0c3096B3Df54AA7f6f5D",
    "Amazon",
    "password",
    "distributor",
    dateAdded
  );
  user = await con.addUser(
    "0x4Da0ec157f15D7072C17962A6E2371A014E6f557",
    "DPD",
    "password",
    "distributor",
    dateAdded
  );
  user = await con.addUser(
    "0xe3BE60D77C3f0fa27a9b82c48eC8b9fA75285d99",
    "Sainsbury's",
    "password",
    "seller",
    dateAdded
  );

  user = await con.addUser(
    "0xbD5Fbf4724C5607C397968bf065BC93536aB7726",
    "Tesco",
    "password",
    "seller",
    dateAdded
  );
  return true;
}

async function addBranches(con) {
  let newBranch = await con.addBranch("Madalin's Home", "51.49233", "-0.02048", dateAdded, {
    from: "0xbD5Fbf4724C5607C397968bf065BC93536aB7726",
  });
  newBranch = await con.addBranch("Madalin's Home", "51.49233", "-0.02048", dateAdded, {
    from: "0xe3BE60D77C3f0fa27a9b82c48eC8b9fA75285d99",
  });
  return true;
}

module.exports = { addUsers, addBranches };
