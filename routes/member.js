const express = require("express");
const prisma = require("../config/prisma");
const memberRouter = express.Router();

memberRouter.get("/profile", async (req, res, next) => {
  try {
    const id = req.user.id;
    const data = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    return res.status(200).json({
      status: "200",
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

memberRouter.get("/items", async (req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      where: {
        userId: req.user.id,
      },
    });

    if (Object.keys(items).length === 0) {
      return res.status(200).json({
        status: "204",
        message: "You don't have any procurement item yet",
      });
    } else {
      return res.status(200).json({
        status: "200",
        data: items,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

memberRouter.get("/items/:status", async (req, res, next) => {
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
        userId: req.user.id,
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

memberRouter.get("/item/:id", async (req, res, next) => {
  try {
    let { id } = req.params;

    id = parseInt(id);

    if (!id) {
      return res.status(400).json({
        status: "400",
        message: "ID params must be filled",
      });
    }

    const item = await prisma.item.findUnique({
      where: {
        id: id,
      },
    });

    if (!item) {
      return res.status(404).json({
        status: "404",
        message: "Item not found",
      });
    }

    if (item.userId !== req.user.id) {
      return res.status(403).json({
        status: "403",
        message: "You don't have accesss to this items",
      });
    }

    return res.status(200).json({
      status: "200",
      data: item,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

memberRouter.post("/item", async (req, res, next) => {
  try {
    const { name, description, category, url, quantity, price, dueDate } =
      req.body;

    if (
      !name ||
      !description ||
      !category ||
      !url ||
      !quantity ||
      !price ||
      !dueDate
    ) {
      return res.status(400).json({
        status: "400",
        message: "All parameter must be filled!",
      });
    }

    const dueDateTime = new Date(dueDate);
    const total = price * quantity;

    const item = await prisma.item.create({
      data: {
        userId: req.user.id,
        name: name,
        url: url,
        description: description,
        category: category,
        quantity: quantity,
        price: price,
        total: total,
        dueDate: dueDateTime,
      },
    });

    return res.status(201).json({
      status: "201",
      message: "Item has ben succesfully sent to admin",
      data: item,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = memberRouter;
