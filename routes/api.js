const express = require("express");
const apiRouter = express.Router();

const jwt = require("jsonwebtoken");
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
const cookieParser = require("cookie-parser");
const prisma = require("../config/prisma");
const adminRouter = require("./admin");
const memberRouter = require("./member");
const jwtkey = process.env.JWT_KEY;

apiRouter.use(cookieParser());

apiRouter.get("/", async (req, res, next) => {
  res.status(200).json({
    status: "200",
    message: "helo",
  });
});

apiRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: "400",
        message: "Username and password must be filled!",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user || !compareSync(password, user.password)) {
      return res.status(404).json({
        status: "404",
        message: "Username/password didn't match our data!",
      });
    } else {
      const token = jwt.sign(
        {
          user: user,
        },
        jwtkey,
        {
          expiresIn: "30m",
        }
      );

      return res.status(200).json({
        status: "200",
        message: "Succesfully login",
        token: token,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

async function verifyTokenAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token === undefined) {
    return res.status(401).json({
      status: "401",
      message: "Access Denied! Unauthorized User",
    });
  } else {
    jwt.verify(token, jwtkey, (err, authData) => {
      if (err) {
        res.status(401).json({
          status: "401",
          message: "Invalid Token...",
        });
      } else {
        const role = authData.user.role;
        if (role === "admin") {
          next();
        } else {
          return res.status(403).json({
            status: "403",
            message: "Access Denied!",
          });
        }
      }
    });
  }
}

async function verifyTokenMember(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token === undefined) {
    return res.status(401).json({
      status: "401",
      message: "Access Denied! Unauthorized User",
    });
  } else {
    jwt.verify(token, jwtkey, (err, decodedToken) => {
      if (err) {
        res.status(401).json({
          status: "401",
          message: "Invalid Token...",
        });
      } else {
        const role = decodedToken.user.role;
        if (role === "member") {
          const user = decodedToken.user;
          req.user = user;
          next();
        } else {
          return res.status(403).json({
            status: "403",
            message: "Access Denied!",
          });
        }
      }
    });
  }
}

apiRouter.use("/admin", verifyTokenAdmin, adminRouter);

apiRouter.use("/member", verifyTokenMember, memberRouter);

module.exports = apiRouter;
