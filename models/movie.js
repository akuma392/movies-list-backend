var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var movieSchema = new Schema(
  {
    title: { type: String, required: true },
    plot: { type: String, required: true },
    rating: { type: String }, // IMDb-style rating
    imdbId: { type: String, unique: true, required: true },

    availableOn: [{ type: String }], // e.g. ["Netflix", "Amazon Prime"]

    likes: { type: Number, default: 0 },
    likedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    type: {
      type: String,
      enum: ["movie", "series"],
      required: true,
    },

    genres: [{ type: String }], // e.g. ["Action", "Drama"]

    trailer: { type: String }, // YouTube or video link
    date: { type: Date }, // Release date
    image: { type: String }, // Poster or thumbnail URL
    public: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);

