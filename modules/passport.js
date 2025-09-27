var passport = require("passport");
var User = require("../models/user");
var GoogleStrategy = require("passport-google-oauth2").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID_GOOGLE,
      clientSecret: process.env.CLIENT_SECRET_GOOGLE,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      //   passReqToCallback: true,
    },
    (accessToken, refreshToken, profile, done) => {
      console.log("Using callback URL>>>>>:", process.env.GOOGLE_CALLBACK_URL);
      var newUser = {
        name: profile.displayName,

        email: profile._json.email,
        avatar: profile._json.picture,
        userName: profile.displayName.replace(/\s+/g, "").toLowerCase(), // fallback
        password: Math.random().toString(36).slice(-8), // random dummy password
      };
      User.findOne({ email: profile._json.email }, (err, user) => {
        if (err) return done(err);
        if (!user) {
          User.create(newUser, (err, addedUser) => {
            if (err) return done(err);
            return done(null, addedUser);
          });
        } else {
          return done(null, user);
        }
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
