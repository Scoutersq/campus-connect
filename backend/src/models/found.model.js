const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const foundSchema = new Schema({
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
    locationFound:{
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
    dateFound:{
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
    default: Date.now
  },
})

const foundModel = mongoose.model("found-items",foundSchema);

module.exports = {
    foundModel:foundModel
}