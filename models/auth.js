const mongoose = require('mongoose');;


const AuthSchema = new mongoose.Schema({
    access_token: {type: String},
    refresh_token: {type: String},
    access_expires: {type: Date},
    refresh_expires: {type: Date},
    key: {type: Number, unique: true}
})

const Auth = mongoose.model('auth', AuthSchema);

exports.Auth = Auth;
