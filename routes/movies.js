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
    const { imdbId } = req.body;

    // 1. Find or create movie
    let movie = await Movie.findOne({ imdbId });
    if (!movie) {
      movie = new Movie({
        title: req.body.title,
        plot: req.body.plot,
        rating: req.body.rating,
        availableOn: req.body.availableOn,
        type: req.body.type,
        genres: req.body.genres,
        trailer: req.body.trailer,
        date: req.body.date,
        image: req.body.image,
        imdbId: imdbId,
        public: false,
        hidden: false,
      });
      movie = await movie.save();
    }

    // 2. Get user
    let user = await User.findById(req.user.userId);

    // 3. Check if already in watchlist
    const alreadyInWatchlist = user.watchList.some(
      (entry) => entry.movie.toString() === movie._id.toString()
    );

    if (alreadyInWatchlist) {
      return res.status(400).json({
        message: "Movie is already in watchlist",
        movie,
        watchList: user.watchList,
      });
    }

    // 4. Add to watchlist
    user.watchList.push({
      movie: movie._id,
      isWatched: false,
    });
    await user.save();

    res.status(201).json({
      message: "Movie added to watchlist",
      movie,
      watchList: user.watchList,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/watchlist/:movieId", auth.verifyToken, async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { availableOn, isWatched } = req.body;

    // 1. Find movie
    let movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    // 2. Update availableOn only if different
    if (availableOn !== undefined && availableOn !== movie.availableOn) {
      movie.availableOn = availableOn;
      await movie.save();
    }

    // 3. Find user
    let user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4. Find watchlist entry
    let watchItem = user.watchList.find(
      (entry) => entry.movie.toString() === movieId
    );
    if (!watchItem) {
      return res.status(400).json({ message: "Movie not in watchlist" });
    }

    // 5. Update isWatched if provided
    if (isWatched !== undefined && isWatched !== watchItem.isWatched) {
      watchItem.isWatched = isWatched;
    }

    await user.save();

    res.json({
      message: "Watchlist updated successfully",
      movie,
      watchList: user.watchList,
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
