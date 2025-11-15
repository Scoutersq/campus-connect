const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    message:{
        type:String,
        required:true
    },
    category:{
        type:String,
        enum:["notices","events","update","holidays","others","emergency"],
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Admin"
    },
    targetAudience:{
        type:String,
        enum:["students","faculty","all"],
        default:"all"
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
      expiresAt: {
    type: Date,
  },
  isImportant: {
    type: Boolean,
    default: false,
    },
    readBy: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: [],
    }
});

const notificationModel = mongoose.model("notifications",notificationSchema);

module.exports = {
    notificationModel:notificationModel
}