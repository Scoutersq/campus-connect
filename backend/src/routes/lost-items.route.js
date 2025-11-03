const { Router } = require("express");
const { lostModel } = require("../models/lost.model.js")
const lostRouter = Router();
const { userMiddleware } = require("../middlewares/user.middleware.js");
const { adminMiddleware } = require("../middlewares/admin.middleware.js");

lostRouter.post("/report", userMiddleware,async (req, res) => {
  try {
    const { title, description, location, contact, image, dateLost } = req.body;

    if (!title || !description || !location || !contact || !dateLost) {
      return res.status(400).json({
        message: "All required fields (title, description, location, contact, dateLost) must be provided",
      });
    }

    const newLostItem = await lostModel.create({
      title,
      description,
      location,
      contact,
      image,
      dateLost,
    });

    res.status(201).json({
      message: "Lost item reported successfully",
      data: newLostItem,
    });
  } catch (e) {
    console.error("Error reporting lost item:", e);
    res.status(500).json({
      message: "Internal server error",
      error: e.message,
    });
  }
});

lostRouter.get("/all",userMiddleware,async(req,res)=>{
    const lostItems = await lostModel.find({});
    res.json({
        lostItems
    })
});

lostRouter.get("/preview",adminMiddleware,async(req,res)=>{
    const lostItems = await lostModel.find({});
    res.json({
        lostItems
    })
});

module.exports = {
    lostRouter:lostRouter
}