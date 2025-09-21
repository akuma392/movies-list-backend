var jwt = require("jsonwebtoken");

module.exports = {
  verifyToken: async (req, res, next) => {
    var token = req.headers.authorization;
    try {
      if (token) {
        var payload = await jwt.verify(token, "secret");
        req.user = payload;
        next();
      } else {
        res.status(400).json({ error: "Token requireds" });
      }
    } catch (error) {
      return error;
    }
  },
  verifyAdmin: async (req, res, next) => {
    var token = req.headers.authorization;
    try {
      if (token) {
        var payload = await jwt.verify(token, "secret");
        req.user = payload;
        if (req.user?.email === "admin1@gmail.com") {
          next();
        } else {
          res.status(400).json({ error: "Dont have admin access" });
        }
      } else {
        res.status(400).json({ error: "Token requireds" });
      }
    } catch (error) {
      return error;
    }
  },
  optionalAuth: async (req, res, next) => {
    var token = req.headers.authorization;
    try {
      if (token) {
        var payload = await jwt.verify(token, "secret");
        req.user = payload;
        next();
      } else {
        next()
      }
    } catch (error) {
      return error;
    }
  },
};
