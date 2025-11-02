const adminSchema = new Schema({
    email:{
        type:String,
        required:true
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
        required:true
    },
    lastName:{
        type:String,
        minlength:2,
        maxlength:10,
        required:true
    }
})
const adminModel = mongoose.model("admin",adminSchema);
module.exports = {
    adminModel:adminModel
}