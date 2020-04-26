const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const secretPassword = "randomGibberishGastronomy22";

// source https://nodejsera.com/encryption-and-decryption-using-nodejs.html

function encrypt(text) {
  const cipher = crypto.createCipher(algorithm, secretPassword);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(text) {
  const decipher = crypto.createDecipher(algorithm, secretPassword);
  let dec = decipher.update(text, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

module.exports = { encrypt, decrypt };
