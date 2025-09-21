var express = require("express");
var router = express.Router();
var Movie = require("../models/movie");
var auth = require("../middleware/auth");
var User = require("../models/user");

// Get all media (filter by category)
router.get("/", auth.optionalAuth, async (req, res, next) => {
  try {
    var movies;
    if (!req.user) {
      movies = await Movie.find({ public: true, hidden: false });
    } else {
      movies = await Movie.find({ hidden: false });
    }
    res.json(movies);
  } catch (err) {
    next(err);
  }
});

router.get(auth.verifyToken);
router.get("/", auth.verifyToken, async (req, res, next) => {
  try {
    let movies = await Movie.find({ hidden: false });
    res.json(movies);
  } catch (err) {
    next(err);
  }
});

router.post("/watchlist", auth.verifyToken, async (req, res, next) => {
  try {
    // Create new Movie with public=false
    let movie = new Movie({
      title: req.body.title,
      plot: req.body.plot,
      rating: req.body.rating,
      availableOn: req.body.availableOn,
      type: req.body.type,
      genres: req.body.genres,
      trailer: req.body.trailer,
      date: req.body.date,
      image: req.body.image,
      imdbId: req.body.imdbId,
      public: false,
      hidden: false
    });
    let savedMovie = await movie.save();

    // Add to user's watchlist
    let user = await User.findById(req.user.userId);
    user.watchList.push({
      movie: savedMovie._id,
      isWatched: false
    });
    await user.save();

    res.status(201).json({
      message: "Movie created and added to watchlist",
      movie: savedMovie,
      watchList: user.watchList
    });
  } catch (err) {
    next(err);
  }
});



router.post("/:movieId/like", auth.verifyToken, async (req, res, next) => {
  try {
    let movie = await Movie.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    if (movie.likedUsers.includes(req.user.userId)) {
      movie.likes -= 1;
      movie.likedUsers.pull(req.user.userId);
    } else {
      movie.likes += 1;
      movie.likedUsers.push(req.user.userId);
    }

    await movie.save();
    res.json(movie);
  } catch (err) {
    next(err);
  }
});



router.put("/:movieId/hidden", auth.verifyToken, async (req, res, next) => {
  try {
    let movie = await Movie.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    const user = await User.findById(req.user.userId);

    // --- Admin can do everything ---
    if (req.user.isAdmin) {
      if (req.body.hidden !== undefined) movie.hidden = !movie.hidden;
      await movie.save();
      return res.json({
        success: true,
        message: "Movie updated by admin",
        movie,
      });
    }

    // --- Check if movie exists in user's watchlist ---
    const isInWatchlist = user.watchList.some(
      (item) => item.movie.toString() === movie._id.toString()
    );

    if (isInWatchlist) {
      if (movie.hidden === false) {
        movie.hidden = true;
        await movie.save();
        return res.json({
          success: true,
          message: "Movie hidden by user (watchlist owner)",
          movie,
        });
      } else {
        return res.status(403).json({
          error: "Watchlist owner can only hide the movie (hidden: true)",
        });
      }
    }

    // --- Otherwise: forbidden ---
    return res.status(403).json({ error: "Not authorized" });
  } catch (err) {
    next(err);
  }
});

router.get("/admin/public", auth.verifyAdmin, async (req, res, next) => {
  try {
    let movies = await Movie.find({ public: false });
    res.json(movies);
  } catch (err) {
    next(err);
  }
});
router.get("/admin/:movieId/public", auth.verifyAdmin, async (req, res, next) => {
  try {
    let movie = await Movie.findById(req.params.movieId);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    // Only admin can make any movie public.
    // Or the owner logic if you want: store owner in Movie schema

    movie.public = !movie.public;
    await movie.save();

    res.json({ success: true, message: "Movie is now public", movie });
  } catch (err) {
    next(err);
  }
});

router.put("/admin/:movieId/delete", auth.verifyAdmin, async (req, res, next) => {
  try {
    let id = req.params.id;
    let movieDeleted = await Movie.findByIdAndDelete(id);
    if (!movieDeleted) return res.status(404).json({ error: "Movie not found" });
    res.json({ success: true, message: "Movie is now deleted", movieDeleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
