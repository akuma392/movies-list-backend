var express = require("express");
var router = express.Router();
var passport = require("passport");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/failure" }),
  (req, res) => {
    console.log(res.req.user, "response");
    res.json({ user: res?.req?.user });
  }
);
module.exports = router;
