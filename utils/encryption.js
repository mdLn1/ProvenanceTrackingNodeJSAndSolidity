const crypto = require("crypto");
const secretPassword = "jocDeNota10";
const bcrypt = require("bcryptjs");
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(String(secretPassword))
  .digest("base64")
  .substr(0, 32);

("use strict");

// https://gist.github.com/vlucas/2bd40f62d20c1d49237a109d491974eb

const IV_LENGTH = 16; // For AES, this is always 16

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

async function saltHash(text) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(text, salt);
  return hashedPassword;
}

async function compareSaltedHash(saltedHash, text) {
  return await bcrypt.compare(text, saltedHash);
}

module.exports = { decrypt, encrypt, saltHash, compareSaltedHash };
