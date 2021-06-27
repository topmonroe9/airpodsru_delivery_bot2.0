const EventBus = require('../eventBus')
const Message = require('../models/messages')
const { sendUpdatedOrderToCourier } = require('./bot.service')

EventBus.on('msg.sent', async payload => {
    const message = await Message.findOne( { lead_id: payload.lead_id })

    if (message) {
        Object.assign( message, payload)
        await message.save()
        return
    }

    const msg = new Message
    Object.assign(msg, payload)
    await msg.save()
})


