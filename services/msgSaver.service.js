const EventBus = require('../eventBus')
const Message = require('../models/messages')


EventBus.on('msg.sent', async payload => {
    const msg = new Message
    Object.assign(msg, payload)
    await msg.save()
    return
})
