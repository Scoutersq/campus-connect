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
    status: {
        type: String,
        enum: ["reported", "claimed", "returned"],
        default: "reported",
        index: true,
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now,
    },
        createdAt: {
        type: Date,
        default: Date.now
    },
})

foundSchema.index({ createdAt: -1 });
foundSchema.index({ status: 1, createdAt: -1 });
foundSchema.index({ reportedBy: 1, createdAt: -1 });
foundSchema.index({ dateFound: -1, createdAt: -1 });
foundSchema.index({ title: "text", description: "text", locationFound: "text" });

const foundModel = mongoose.model("found-items",foundSchema);

module.exports = {
    foundModel:foundModel
}