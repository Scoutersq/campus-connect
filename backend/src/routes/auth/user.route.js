const { Router } = require("express");
const userRouter = Router();
const { userModel } = require("../../models/user.model.js")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


userRouter.post("/signup",async(req,res)=>{
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password,10);

    try{
    await userModel.create({
        firstName:firstName,
        lastName:lastName,
        email:email,
        password:hashedPassword
    });
    res.status(200).json({
        message:"Sign up successful"
    })
}catch(e){
    res.status(400).json({
        message:"Signup failed",
        error:e.message
    });
}
})

userRouter.post("/signin",async(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;

    try{
    const user = await userModel.findOne({
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
            id:user._id,
            role:"user"
        },process.env.JWT_USER_SECRET)

        res.cookie("token",token)
    }
    res.status(200).json({
        message:"Signed In successful"
    })
}catch(e){
    res.status(500).json({
        message:"Internal Server error",
        error:e.message
    })
}
    
})

module.exports = {
    userRouter:userRouter
}