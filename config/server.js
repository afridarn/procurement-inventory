require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const prisma = require("./prisma");
const apiRouter = require("../routes/api");
const { hashSync, genSaltSync } = require("bcrypt");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(cors());

app.use(cookieParser());

app.use("/", apiRouter);

app.listen(PORT, async () => {
  console.log(`server is listening  on ${PORT}`);
  try {
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "admin",
      },
    });
    if (!adminUser) {
      const salt = genSaltSync(10);
      await prisma.user.create({
        data: {
          name: "Admin",
          username: "admin",
          email: "admin@gmail.com",
          password: hashSync("admin123", salt),
          role: "admin",
        },
      });
      console.log("Admin account created");
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
