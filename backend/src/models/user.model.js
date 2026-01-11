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
    phoneNumber: {
        type: String,
        trim: true,
        maxlength: 20,
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 400,
    },
    academicYear: {
        type: String,
        trim: true,
        maxlength: 40,
    },
    department: {
        type: String,
        trim: true,
        maxlength: 80,
    },
    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        match: /^ST([1-9]|1[0-9]|20)$/
    },
    avatarUrl: {
        type: String,
        trim: true,
        maxlength: 2048
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

userSchema.index({ createdAt: -1 });

const userModel = mongoose.model("User", userSchema, "users");


module.exports = {
    userModel:userModel,
}