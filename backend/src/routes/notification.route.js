const { Router } = require("express");
const { notificationModel } = require("../models/notifications.model.js");
const { adminMiddleware } = require("../middlewares/admin.middleware.js");
const notificationRouter = Router();

notificationRouter.post("/create",adminMiddleware,async(req,res)=>{
    try{
    const {title,message,category,targetAudience,expiresAt,isImportant} = req.body;

       if (!title || !message || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, message, and category are required.",
      });
    }

    const notification = await notificationModel.create({
        title:title,
        message:message,
        category:category,
        targetAudience:targetAudience,
        expiresAt:expiresAt,
        isImportant:isImportant,
        createdBy: req.adminID
    })
    res.status(200).json({
        success:true,
        message:"Notification created successfully",
        notification
    })
    }catch(e){
        res.status(500).json({
            message:"Internal server error",
            error:e.message
        })
    }
})

notificationRouter.get("/", async (req, res) => {
  try {
    const notifications = await notificationModel.find({})
      .sort({ createdAt: -1 })
      .lean();

    if (!notifications.length) {
      return res.status(404).json({
        success: false,
        message: "No notifications found.",
      });
    }

    res.status(200).json({
      success: true,
    notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

module.exports = {
    notificationRouter:notificationRouter
}