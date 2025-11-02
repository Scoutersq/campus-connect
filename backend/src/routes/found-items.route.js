const { Router } = require("express");
const foundRouter = Router();
const { foundModel } = require("../models/found.model.js")

foundRouter.post("/report",async(req,res)=>{
const { title, description, location, date, contact, image } = req.body;

try {
  if (!title || !description || !location || !date || !contact) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  await foundModel.create({
    title,
    description,
    locationFound: location,
    dateFound: date,
    contact,
    image,
  });

  res.status(201).json({ message: "Found item reported successfully" });

} catch (error) {
  console.error("Error creating found item:", error);
  res.status(500).json({
    message: "Internal Server Error",
    error: error.message,
  });
}

})

foundRouter.get("/preview",async(req,res)=>{
    const preview = await foundModel.find({});
    res.json({
        preview
    })
})

module.exports = {
    foundRouter:foundRouter
}