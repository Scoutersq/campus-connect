const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const adminSchema = new Schema({
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
        required:true
    },
    firstName:{
        type:String,
        minlength:3,
        maxlength:20,
        required:true,
        trim:true
    },
    lastName:{
        type:String,
        minlength:2,
        maxlength:10,
        required:true,
        trim:true
    },
    activeSessionId: {
        type: String,
        default: null,
        index: true,
    },
    sessionExpiresAt: {
        type: Date,
        default: null,
        index: true,
    }
})
const adminModel = mongoose.model("Admin", adminSchema, "admins");
module.exports = {
    adminModel:adminModel
}