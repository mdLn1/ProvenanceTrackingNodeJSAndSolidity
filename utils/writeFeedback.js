module.exports = function(error) {
  if (!Array.isArray(error)) {
    error = [error];
  }

  return { errors: error };
};
