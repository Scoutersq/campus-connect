const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const lostSchema = new Schema({
    title:{
        type:String,
        requied:true,
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
    },
    contact:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        default:""
    },
    dateLost:{
        type:Date,
        required:true
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