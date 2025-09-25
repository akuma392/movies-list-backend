var express = require("express");
var User = require("../models/user");
var router = express.Router();
var auth = require("../middleware/auth");
/* GET home page. */
router.use(auth.verifyToken);
router.get("/:userId", async function (req, res, next) {
  try {
    var userId = req.params.userId;
    const profile = await User.findById(
      userId,
      "name email isAdmin isBlocked userName avatar watchList"
    ).populate({
      path: "watchList.movie",  // populate movie field inside watchList
      model: "Movie",           // ensure it matches your Movie model name
      select: "title plot rating image availableOn hidden public", // choose fields to return
    });
    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

router.get("/admin", auth.verifyAdmin, async (req, res, next) => {
  try {
    let movies = await Movie.find({});
    res.json(movies);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
