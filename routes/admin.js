const express = require("express");
const prisma = require("../config/prisma");
const adminRouter = express.Router();

const { hashSync, genSaltSync, compareSync, hash } = require("bcrypt");

adminRouter.get("/members", async (req, res, next) => {
  try {
    const member = await prisma.user.findMany({
      where: {
        role: "member",
        is_active: true,
      },
    });

    if (Object.keys(member).length === 0) {
      return res.status(200).json({
        status: "204",
        message: "No member found",
      });
    } else {
      return res.status(200).json({
        status: "200",
        data: member,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

adminRouter.post("/member", async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        status: "400",
        message: "All parameter must be filled!",
      });
    }

    const checkUsername = await prisma.user.findFirst({
      where: {
        username: username,
        is_active: true,
      },
    });

    const checkEmail = await prisma.user.findFirst({
      where: {
        email: email,
        is_active: true,
      },
    });

    if (checkEmail || checkUsername) {
      return res.status(200).json({
        status: "200",
        message: "Username/email has been taken",
      });
    }

    const salt = genSaltSync(10);

    const member = await prisma.user.create({
      data: {
        name: name,
        email: email,
        username: username,
        password: hashSync(password, salt),
      },
    });

    return res.status(201).json({
      status: 200,
      message: "Member account succesfully created",
      data: member,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

adminRouter.put("/member/:id", async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;
    let { id } = req.params;
    if (!id || !name || !username || !email || !password) {
      return res.status(400).json({
        status: "400",
        message: "All parameter must be filled!",
      });
    }

    id = parseInt(id);

    const member = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!member) {
      return res.status(404).json({
        status: "404",
        message: "Member with id " + id + " not found",
      });
    }

    const checkUsername = await prisma.user.findFirst({
      where: {
        username: username,
        is_active: true,
      },
    });

    const checkEmail = await prisma.user.findFirst({
      where: {
        email: email,
        is_active: true,
      },
    });

    if (checkEmail || checkUsername) {
      return res.status(200).json({
        status: "200",
        message: "Username/email has been taken",
      });
    }

    const salt = genSaltSync(10);
    const updatedMember = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        name: name,
        username: username,
        email: email,
        password: hashSync(password, salt),
      },
    });

    return res.status(201).json({
      status: "201",
      message: "Member account has succesfully updated",
      data: updatedMember,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

adminRouter.delete("/member/:id", async (req, res, next) => {
  try {
    let { id } = req.params;
    id = parseInt(id);

    const member = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!member) {
      return res.status(404).json({
        status: "404",
        message: "Member with id " + id + " not found",
      });
    }

    await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        is_active: false,
      },
    });

    return res.status(200).json({
      status: "200",
      message: "Member account has succesfully deleted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

adminRouter.get("/items", async (req, res, next) => {
  try {
    const items = await prisma.item.findMany();
    if (Object.keys(items).length === 0) {
      return res.status(200).json({
        status: "204",
        message: "No item found",
      });
    }

    return res.status(200).json({
      status: "200",
      data: items,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

adminRouter.get("/items/:status", async (req, res, next) => {
  try {
    const { status } = req.params;
    if (status !== "onprocess" && status !== "approve" && status !== "reject") {
      return res.status(404).json({
        status: "404",
        message: "Only choose available status: onprocess, approve, reject",
      });
    }

    const items = await prisma.item.findMany({
      where: {
        status: status,
      },
    });

    if (Object.keys(items).length === 0) {
      return res.status(200).json({
        status: "204",
        message: "No items found with status " + status,
      });
    }

    return res.status(200).json({
      status: "200",
      data: items,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

adminRouter.patch("/item/:id", async (req, res, next) => {
  try {
    let { id } = req.params;
    const { status } = req.body;
    id = parseInt(id);

    if (status !== "onprocess" && status !== "approve" && status !== "reject") {
      return res.status(404).json({
        status: "404",
        message: "Only choose available status: onprocess, approve, reject",
      });
    }

    let item = await prisma.item.findUnique({
      where: {
        id: id,
      },
    });

    if (Object.keys(item).length === 0) {
      return res.status(200).json({
        status: "204",
        message: "No items found with status " + status,
      });
    }

    if (status === item.status) {
      return res.status(400).json({
        status: "400",
        message: "This item already has " + status + " status",
      });
    }

    item = await prisma.item.update({
      where: {
        id: id,
      },
      data: {
        status: status,
      },
    });

    return res.status(200).json({
      status: "200",
      message: "Succesfully change item status to " + status,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = adminRouter;
