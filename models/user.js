var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var Schema = mongoose.Schema;

var userSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true },
    password: { type: String, minlength: 5, required: true },
    userName: { type: String, unique: true },
    avatar: { type: String },

    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    watchList: [
      {
        movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
        isWatched: { type: Boolean, default: false },
        addedAt: { type: Date, default: Date.now }
      }
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.email == "admin1@gmail.com" || this.email == "admin2@gmail.com") {
    this.isAdmin = true;
  }
  next();
});

userSchema.methods.verifyPassword = async function (password) {
  try {
    var result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error) {
    return error;
  }
};

userSchema.methods.signToken = async function () {
  var payload = { userId: this.id, email: this.email, isAdmin: this.isAdmin };
  try {
    var token = await jwt.sign(payload, "secret");
    return token;
  } catch (error) {
    return error;
  }
};

userSchema.methods.userJSON = function (token) {
  return {
    name: this.name,
    email: this.email,
    isAdmin: this.isAdmin,
    isBlocked: this.isBlocked,
    userName: this.userName,
    avatar: this.avatar,
    token: token,
    watchlist: this.watchlist
  };
};

var User = mongoose.model("User", userSchema);

module.exports = User;
