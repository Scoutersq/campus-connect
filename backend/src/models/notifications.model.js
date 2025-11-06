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
        enum:["notices","events","update","holidays","others"],
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
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
  }
});

const notificationModel = mongoose.model("notifications",notificationSchema);

module.exports = {
    notificationModel:notificationModel
}