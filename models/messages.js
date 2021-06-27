const mongoose = require('mongoose');;


const MessagesSchema = new mongoose.Schema({
    message_id: { type: Number },
    chat_id: {type: Number },
    username: { type: String },

    lead_id: { type: Number },
    status_id: { type: String },
    pipeline_id: { type: String },

    contact_name: { type: String },
    contact_phone: { type: String },
    shipping_address: { type: String },
    shipping_date: { type: String },
    comment: { type: String },
    sdek_id: { type: String },

    mapLink: { type: String },
    msg_type: { type: String, enum: ['onNewOrderMsc', 'onAcceptedOrderMsc', 'onReturnMsc', 'onNewOrderSdek', 'onReturnSdek' ]},

    created_at: { type: Date },
    updated_at: { type: Date },
})

const messages = mongoose.model('messages', MessagesSchema);

module.exports = messages;
