const { Router } = require("express");
const foundRouter = Router();
const { foundModel } = require("../models/found.model.js")

foundRouter.post("/report",async(req,res)=>{
    const {title,description,location,date,contact,image} = req.body;

    try{
    await foundModel.create({
        title:title,
        description:description,
        locationFound:location,
        dateFound:date,
        image:image,
        contact:contact
    })
    res.status(200).json({
        message:"Found item reported successfully"
    })
}catch(e){
    res.status(500).json({
        message:"Internal Server error",
        error:e.message
    })
}
})

module.exports = {
    foundRouter:foundRouter
}