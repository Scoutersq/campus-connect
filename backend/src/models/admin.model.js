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
    adminCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        match: /^ADM([1-9]|1[0-9]|20)$/
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
}, { timestamps: true });

adminSchema.index({ createdAt: -1 });

const adminModel = mongoose.model("Admin", adminSchema, "admins");
module.exports = {
    adminModel:adminModel
}