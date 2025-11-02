const { Router } = require("express");
const { adminModel } = require("../models/admin.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const adminRouter = Router();

adminRouter.post("/signup",async(req,res)=>{
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password,5);

    try{
    await adminModel.create({
        firstName:firstName,
        lastName:lastName,
        email:email,
        password:hashedPassword
    })
    res.status(200).json({
        message:"Signup successfull"
    })
}catch(e){
    res.status(400).json({
        message:"Signup failed",
        error:e.message
    })
}
})

adminRouter.post("/signin",async(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;

    const user = await adminModel.findOne({
        email:email
    })

    if(!user){
        res.status(403).json({
            message:"Invalid Credentials"
        })
    }

    const passwordMatch = await bcrypt.compare(password,user.password);

    if(!passwordMatch){
        res.status(403).json({
            message:"Invalid Credentials"
        })
    }

    if(user && passwordMatch){
        const token = jwt.sign({
            id:user._id
        },process.env.JWT_ADMIN_SECRET)

        res.cookie("token",token)
    }
    res.status(200).json({
        message:"Sign in successful"
    })
})

module.exports = {
    adminRouter:adminRouter
}