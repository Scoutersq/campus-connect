const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const lostSchema = new Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    location:{
        type:String,
        required:true,
        trim:true
    },
    contact:{
        type:String,
        required:true,
        trim:true
    },
    image:{
        type:String,
        default:"",
        trim:true
    },
    dateLost:{
        type:Date,
        required:true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
    type: Date,
    default: Date.now,
  },
});

const lostModel = mongoose.model("lost-items",lostSchema);
module.exports = {
    lostModel:lostModel
}