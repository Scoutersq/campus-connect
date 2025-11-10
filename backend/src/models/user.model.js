const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        match:/^[\w-.]+@[\w-]+\.[\w-.]+$/
    },
    password:{
        type:String,
        minlength:6,
        maxlength:80,
        trim:true
    },
    firstName:{
        type:String,
        required:true,
        minlength:3,
        maxlength:20,
        trim:true
    },
    lastName:{
        type:String,
        required:true,
        minlength:2,
        maxlength:10,
        trim:true
    },
    avatarUrl: {
        type: String,
        trim: true,
        maxlength: 2048
    }
})



const userModel = mongoose.model("User", userSchema, "users");


module.exports = {
    userModel:userModel,
}