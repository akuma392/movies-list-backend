var express = require("express");
var router = express.Router();

router.get("/", (req, res, next) => {
  res.json({ message: "welcome to sheenu api" });
});
router.get("/test-env", (req, res) => {
  res.json({
    uri: process.env.MONGODB_URI
      ? `✅ Found${process.env.MONGODB_URI}`
      : "❌ Not Found",
  });
});

module.exports = router;
