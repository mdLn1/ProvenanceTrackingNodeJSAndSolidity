const crypto = require("crypto");
const secretPassword = "jocDeNota10";
const bcrypt = require("bcryptjs");

// a key generated from secretPassword above
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(String(secretPassword))
  .digest("base64")
  .substr(0, 32);

("use strict");

const secretKey = "strongSecretKey123-|";

// https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb

const IV_LENGTH = 16; // For AES, this is always 16

const hmacSha = (data) => {
  let hmac = crypto.createHmac("sha512", secretKey);
  hmac.update(data);
  return hmac.digest("hex");
};

// iv is a random generated buffer of length 16
// the cipher is the algorithm that performs the encryption
// encrypted variable contains the full content of the generated encrypted version of the original text
function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

// reverses the process of encryption achieved above
function decrypt(text) {
  let textParts = text.split(":");
  let iv = Buffer.from(textParts.shift(), "hex");
  let encryptedText = Buffer.from(textParts.join(":"), "hex");
  let decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

// hashing with a salt a given text by using bcryptjs library
async function saltHash(text) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(text, salt);
  return hashedPassword;
}

// evaluating if a text could be computed to achieve the result obtained with the use of the function above
async function compareSaltedHash(saltedHash, text) {
  return await bcrypt.compare(text, saltedHash);
}

module.exports = { decrypt, encrypt, saltHash, compareSaltedHash, hmacSha };
