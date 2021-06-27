const mongoose = require('mongoose');;


const UserSchema = new mongoose.Schema({
    token: {
        type: String,
        unique: true
    },
    username: {type: String},
    name: {
        type: String,
    },
    courierName: {type: String},
    chatId: {
        type: String,
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }

})

const User = mongoose.model('courier', UserSchema);

exports.User = User;
