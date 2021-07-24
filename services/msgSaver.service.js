const EventBus = require('../eventBus')
const Message = require('../models/messages')

EventBus.on('msg.sent', async payload => {
    let message = await Message.findOne({lead_id: payload.lead_id})

    if (!message) {
        message = new Message
    }

    Object.assign(message, payload)
    message.status_id = payload.upcoming_status
    await message.save()

})


