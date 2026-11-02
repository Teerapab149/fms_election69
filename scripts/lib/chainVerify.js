// scripts/lib/chainVerify.js, kept so the command-line tools and the e2e helpers
// keep their require path. The logic moved to src/lib/chainVerify.js when the
// certification step started running it inside the web app's transaction.
module.exports = require("../../src/lib/chainVerify");
