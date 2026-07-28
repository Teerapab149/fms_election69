// Password generation shared by the admin scripts.
//
// 20 characters from an unambiguous alphabet (no O/0, no l/1/I) because this
// gets read off a terminal, pasted into a chat, and typed on a phone. 57^20 is
// about 116 bits — with bcrypt cost 12 behind a 10-attempts-per-5-minutes rate
// limit, guessing is not a threat model, so the only job left is to be legible.
const crypto = require("node:crypto");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generatePassword(len = 20) {
  const out = [];
  while (out.length < len) {
    // rejection sampling — plain modulo on random bytes would bias the early
    // letters of the alphabet
    for (const b of crypto.randomBytes(len)) {
      if (b < 256 - (256 % ALPHABET.length)) out.push(ALPHABET[b % ALPHABET.length]);
      if (out.length === len) break;
    }
  }
  return out.join("");
}

module.exports = { generatePassword, ALPHABET };
