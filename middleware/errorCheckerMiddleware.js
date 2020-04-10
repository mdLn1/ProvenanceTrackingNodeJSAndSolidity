const { validationResult } = require("express-validator");
const writeFeedback = require("../utils/writeFeedback");

module.exports = function errorChecker(req, res, next) {
  const {errors} = validationResult(req);
  if (errors.length > 0) {
    return res
      .status(400)
      .json(writeFeedback([...new Set(errors.map(el => el.msg))]));
  }
  next();
};
