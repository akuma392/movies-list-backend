var express = require("express");
var router = express.Router();
var User = require("../models/user");
var auth = require("../middleware/auth");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/register", async (req, res, next) => {
  try {
    var user = await User.create(req.body);
    var token = await user.signToken();
    res.status(201).json({ user: user.userJSON(token) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  var { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      error: "Email/password required",
    });
  }
  try {
    var user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        error: "Email not registered",
      });
    }
    var result = await user.verifyPassword(password);
    if (!result) {
      return res.status(400).json({
        error: "Invalid password",
      });
    }
    if (user?.isBlock) {
      return res.status(400).json({
        error:
          "Your are blocked by Admin. Please contact admin to perform this operation",
      });
    }
    // generate token
    var token = await user.signToken();
    res.json({ user: user.userJSON(token) });
  } catch (error) {
    next(error);
  }
});
router.get(auth.verifyToken);
router.get("/admin", auth.verifyAdmin, async function (req, res, next) {
  try {
    var users = await User.find({}, "name email isBlock isAdmin watchList");
    res.json(users);
  } catch (err) {
    next(err);
  }
});
router.get(
  "/admin/:userId/block",
  auth.verifyAdmin,
  async function (req, res, next) {
    try {
      let id = req.params.userId;
      var users = await User.findByIdAndUpdate(id, { isBlock: true });
      res.redirect("/api/users/admin");
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  "/admin/:userId/unblock",
  auth.verifyAdmin,
  async function (req, res, next) {
    try {
      let id = req.params.userId;
      var users = await User.findByIdAndUpdate(id, { isBlock: false });
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
);
module.exports = router;
