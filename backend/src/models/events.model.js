const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventsSchema = new Schema({
    title:{
        type:String,
        required:true,
        trim:true,
        minlength:3
    },
    description:{
        type:String,
        required:true,
        trim:true,
        minlength:5
    },
    venue:{
        type:String,
        required:true,
        trim:true
    },
    date:{
        type:Date,
        required:true
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

const eventModel = mongoose.model("events",eventsSchema);
module.exports = {
    eventModel:eventModel
}