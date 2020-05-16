const jwt = require("jsonwebtoken");
const config = require("config");
const writeFeedback = require("../utils/writeFeedback");
const { decrypt } = require("../utils/encryption");

module.exports = async (req, res, next) => {
  try {
    let token = req.header("x-auth-token");
    if (!token) {
      return res
        .status(401)
        .json(writeFeedback("You must be logged in to perform this action"));
    }
    try {
      token = decrypt(token);
    } catch (error) {
      return res
        .status(401)
        .json(writeFeedback("Invalid authentication token"));
    }
    const decoded = jwt.verify(token, config.get("jwtSecret"));

    req.user = decoded.user;

    next();
  } catch (err) {
    next(err);
  }
};
