// v2-SEC — ballot cryptography (node:crypto ONLY, no new dependencies).
//
// Three primitives, all pure functions of their inputs:
//   encryptBallot(candidateId, publicKeyPem) -> base64 ciphertext
//   chainHash(secret, prevHash, payload, seq) -> hex HMAC (the tamper-evidence)
//   decryptBallot(payload, privateKeyPem)     -> candidateId  (OFFLINE scripts only)
//
// CommonJS on purpose: standalone node scripts `require` this, and the Next.js
// vote route imports it through webpack (which handles the CJS interop). Keeping
// it dependency-free means the same code runs in both worlds unchanged.

const crypto = require("node:crypto");

/**
 * PEM stored in a .env value keeps its newlines as the literal two characters
 * "\n"; PEM read from a real file already has real newlines. Normalize both so
 * callers never care which source the key came from.
 * @param {string} pem
 */
function normalizePem(pem) {
  if (typeof pem !== "string" || pem.trim() === "") {
    throw new Error("ballotCrypto: empty/invalid PEM key");
  }
  return pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
}

/**
 * Encrypt a ballot choice. The plaintext is a tiny JSON object
 *   { c: <candidateId:int>, n: <128-bit random nonce hex> }
 * The nonce makes two ballots for the same candidate produce different
 * ciphertext (RSA-OAEP is already randomized, but the explicit nonce also
 * defends the offline decrypt path against any dictionary over the small
 * candidate-id space). RSA-OAEP(sha256) — the plaintext (~50 bytes) is far
 * below the ~190-byte limit of a 2048-bit key.
 *
 * @param {number|string} candidateId
 * @param {string} publicKeyPem  election public key (PEM; \n-escaped ok)
 * @returns {string} base64 ciphertext
 */
function encryptBallot(candidateId, publicKeyPem) {
  const c = parseInt(candidateId, 10);
  if (Number.isNaN(c)) throw new Error("ballotCrypto: candidateId is not a number");
  const plaintext = JSON.stringify({ c, n: crypto.randomBytes(16).toString("hex") });
  const buf = crypto.publicEncrypt(
    {
      key: normalizePem(publicKeyPem),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(plaintext, "utf8")
  );
  return buf.toString("base64");
}

/**
 * Decrypt a ballot payload back to its candidateId. Requires the election
 * PRIVATE key, which by policy NEVER lives on the server — this path is used
 * only by offline dispute/recount scripts run by the key-holders.
 *
 * @param {string} payload         base64 ciphertext from Ballot.payload
 * @param {string} privateKeyPem   election private key (PEM; \n-escaped ok)
 * @returns {number} candidateId
 */
function decryptBallot(payload, privateKeyPem) {
  const buf = crypto.privateDecrypt(
    {
      key: normalizePem(privateKeyPem),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(payload, "base64")
  );
  const obj = JSON.parse(buf.toString("utf8"));
  return obj.c;
}

/**
 * The per-row chain link. rowHash = HMAC-SHA256(secret, prevHash|payload|seq).
 * Binding `seq` into the MAC means a row cannot be moved/renumbered without
 * detection; binding `prevHash` links it to the whole history before it. The
 * secret lives only on the server (BALLOT_CHAIN_SECRET) — an attacker with DB
 * write but not the secret cannot forge a valid chain.
 *
 * @param {string} secret    BALLOT_CHAIN_SECRET
 * @param {string} prevHash  rowHash of the previous ballot (or "GENESIS")
 * @param {string} payload   this ballot's ciphertext (exact stored bytes)
 * @param {number} seq       this ballot's sequence number
 * @returns {string} hex digest
 */
function chainHash(secret, prevHash, payload, seq) {
  if (typeof secret !== "string" || secret === "") {
    throw new Error("ballotCrypto: empty BALLOT_CHAIN_SECRET");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`${prevHash}|${payload}|${seq}`)
    .digest("hex");
}

module.exports = { encryptBallot, decryptBallot, chainHash, normalizePem };
