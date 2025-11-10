const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email:{
        type:String,
        required:true
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
})



const userModel = mongoose.model("User", userSchema, "users");


module.exports = {
    userModel:userModel,
}