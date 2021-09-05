const {Telegraf} = require("telegraf");
const crypto = require("crypto");
const {User} = require("../models/users");
const Message = require('../models/messages')
const {session} = require('telegraf-session-mongodb');
const {MongoClient} = require('mongodb');

// middlewares
const auth = require('./auth.middleware')
const commandArgs = require('./cmdArgs.midleware')
const EventBus = require('../eventBus')

// services
const botService = require("../services/bot.service");
const eventService = require('../services/events.service')
const crmDataService = require("../services/crmData.service");


const bot = new Telegraf(process.env.BOT_TOKEN);
const admins = require('./admins.json');
const messages = require("../models/messages");
const mongodbURI = process.env.MONGO_URI 

MongoClient.connect(mongodbURI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(client => {
        const db = client.db();
        bot.use(session(db, {collectionName: process.env.MONGO_COLLNAME_SESSIONS}));
        bot.use(commandArgs())

        bot.launch()
            .then(async r => {
                await onLaunchJobs()
            })
    });


bot.catch((err, ctx) =>  {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
    ctx.telegram.sendMessage(admins[0].chatId, `Произошла ошибка на сервере\n\`${err}\``)
    // ctx.telegram.sendMessage(admins[1].chatId, `Произошла ошибка на сервере\n\`${err}\``)
})

bot.command('whoami', async (ctx) => {
    let msg = `*Имя*: \`${ctx.from.first_name}\`\n`
    msg += `*UserName*: \`${ctx.from.username}\`\n`
    msg += `*ChatId*: \`${ctx.message.chat.id}\`\n`
    await ctx.replyWithMarkdown(msg)
})

function isAdmin(username) {
    let value = false
    admins.forEach(admin => {
        if (admin.username === username)
            value = true
    })
    console.log(username + 'tried admin command. Allowed: ' + value)
    return value
}

/**
 * Admin Commands
 */
bot.command('integrationCode', commandArgs(), async (ctx) => {
    let code = ctx.state.command.args[0]
    if (!code) return ctx.reply("Крутая команда, да? Я только кода атворизации не вижу... ")
    if (await crmDataService.fetchAccessTokenFromAccessCode(code))
        ctx.reply('Да, теперь все четко. Спасибо')

})

bot.command('regcourier', commandArgs(), async (ctx) => {
    if (!isAdmin(ctx.from.username))
        return
    const name = ctx.state.command.args[0];

    if (name === undefined || name === '') {
        await ctx.reply('Мне нужно имя курьера.')
        return
    }

    if (await User.findOne({name: name})) {
        await ctx.reply('Курьер с таким именем уже существует')
        return
    }

    //write name to db
    const user = new User
    user.name = name.charAt(0).toUpperCase() + name.slice(1)
    user.token = randomTokenString()
    await user.save()

    await ctx.replyWithMarkdown(`Я записал. Вот пропуск курьера\n\`${user.token}\``)

})

bot.command('delcourier', commandArgs(), async (ctx) => {
    if (!await isAdmin(ctx.from.username))
        return

    const name = ctx.state.command.args[0];
    console.log('deleting courier: ' + name)
    if (name === undefined || name === '') {
        await ctx.reply('Мне нужно имя курьера.')
        return
    }

    const user = await User.findOne({name: name})

    if (!user) {
        await ctx.reply('Я не знаю такого курьера.')
        return
    }

    await user.deleteOne({name: name})

    await ctx.replyWithMarkdown(`Стер его к чертям.`)

})

bot.hears('Курьеры', async (ctx) => {
    if (!await isAdmin(ctx.from.username))
        return
    const users = await User.find()
    if (!users) {
        // ctx.reply('Нет у тебя курьеров. Бедный...')
        return
    }
    let reply = ''
    users.forEach(user => {
        reply += `*${user.name}*\n\`${user.token}\`\n${user.chatId}\n\n`
    })
    ctx.replyWithMarkdown(reply)
})

bot.command('register', commandArgs(), async (ctx) => {
    const token = ctx.state.command.args[0];
    if (token === undefined || token === '') {
        await ctx.reply('Мне нужен пропуск.')
        return
    }

    const user = await User.findOne({token: token})
    if (!user) {
        ctx.reply('Невалидный код доступа. Извини.')
        return
    }


    user.courierName = ctx.from.first_name
    user.username = ctx.from.username
    user.chatId = ctx.chat.id
    await user.save()

    let reply = ''
    reply += `Привет ${user.courierName}. Я тебя запомнил. Как будут заказы - дам знать.`
    await ctx.replyWithMarkdown(reply)

    return
})


EventBus.on('courier-assigned', async (webhook) => {
    let msgLead
    if ( webhook.leads.add ) {
        msgLead = await Message.findOne({lead_id: webhook.leads.add[0].id})
    } else if ( webhook.leads.status ) {
        msgLead = await Message.findOne({lead_id: webhook.leads.status[0].id})
    }
    if (msgLead) {
        console.log('received courier assigned hook, but bot already has this lead.')
        return
    }
    const lead = await crmDataService.getLeadById(getLeadIdFromWebHook(webhook))
    const contact = await crmDataService.getContactById(lead.data._embedded.contacts[0].id)
    const {chatId, data} = await eventService.onCourierAssigned(lead.data, contact)
    await botService.sendNewOrderToCoruier(bot, chatId, data)
})

function getLeadIdFromWebHook(webhook) {
    let id;
    if (webhook.leads.add)
        id = webhook.leads.add[0].id
    else if (webhook.leads.status)
        id = webhook.leads.status[0].id
    else
        throw new Error("Не удалось определить айди лида")
    return id;
}

EventBus.on('return-created', async (webhook) => {
       let msgLead
    if ( webhook.leads.add ) {
        msgLead = await Message.findOne({lead_id: webhook.leads.add[0].id})
    } else if ( webhook.leads.status ) {
        msgLead = await Message.findOne({lead_id: webhook.leads.status[0].id})
    }
    if (msgLead) {
        console.log('received return created hook, but bot already has this lead.')
        return
    }
    console.log('event return created')
    const lead = await crmDataService.getLeadById(getLeadIdFromWebHook(webhook))
    const contact = await crmDataService.getContactById(lead.data._embedded.contacts[0].id)
    const {chatId, data} = await eventService.onCourierAssigned(lead.data, contact)
    await botService.sendNewOrderToCoruier(bot, chatId, data)
})

/**
 * Уведомляем курьера о новом лиде. Новый лид сохраняется по ивенту msg.sent
 */
EventBus.on('lead.updated', async payload => {
    console.log('catched  lead updated event')
    await botService.sendUpdatedOrderToCourier(bot, payload)
})

// Обработчик начала диалога с ботом
bot.start((ctx) => {

    ctx.reply(
        `Приветствую, ${
            ctx.from.first_name ? ctx.from.first_name : "хороший человек"
        }!`
    )

});


bot.action(/ACCEPT_SHIPPING_+/, async (ctx) => {
    console.log(ctx)
    const order_id = ctx.match.input.substring(16);
    const lead = await crmDataService.getLeadById(order_id)
    const contact = await crmDataService.getContactById(lead.data._embedded.contacts[0].id)


    const {chatId, data, newLeadStageData} = await eventService.shippingAccepted(lead.data, contact)
    if (data.delivery_type === 'courier')
        await botService.sendOrderDetailsToCourier(bot, chatId, data)

    ctx.deleteMessage()
    await crmDataService.moveLeadToNextStage(newLeadStageData)
})

bot.action(/REJECT_SHIPPING_+/, async (ctx) => {
    let order_id = ctx.match.input.substring(16);
    const lead = await crmDataService.getLeadById(order_id)
    const contact = await crmDataService.getContactById(lead.data._embedded.contacts[0].id)
    const {newLeadStageData} = await eventService.shippingRejected(lead.data, contact)
    await Promise.all([
        ctx.deleteMessage(),
        messages.deleteOne({lead_id: lead.data.id}),
        crmDataService.moveLeadToNextStage(newLeadStageData)
    ])
});

bot.action(/SHIPPING_SUCCESS_+/, async (ctx, bot) => {
    let order_id = ctx.match.input.substring(17);
    const lead = await crmDataService.getLeadById(order_id)
    const contact = await crmDataService.getContactById(lead.data._embedded.contacts[0].id)

    const newLeadStageData = eventService.shippingSucceeded(lead.data, contact)
    await Promise.all([
        ctx.deleteMessage(),
        crmDataService.moveLeadToNextStage(newLeadStageData),
    ]);
});

bot.action(/SHIPPING_REJECTED_+/, async (ctx, bot) => {
    let order_id = ctx.match.input.substring(18);
    const lead = await crmDataService.getLeadById(order_id)
    const {chatId, data, newLeadStageData} = await eventService.shippingRejected(lead.data)
    await Promise.all([
        ctx.deleteMessage(),
        messages.deleteOne({lead_id: lead.data.id}),
        crmDataService.moveLeadToNextStage(newLeadStageData)
    ])
});


async function notifyAdminAboutError() {
    for (const admin of admins) {
        console.log('notifying admin about error')
        await bot.telegram.sendMessage(admin.chatId, "Привет, я включился, но у меня не получается авторизоваться в AmoCRM..." +
            "Можешь прислать мне новый код авторизации интеграции?" +
            "\n/integrationCode")
    }
}


async function notifyAdminAboutAccessError() {
    for (const admin of admins) {
        console.log('notifying admin about access error')
        await bot.telegram.sendMessage(admin.chatId, "Привет, я включился, но у меня не получается авторизоваться в AmoCRM..." +
            "Можешь прислать мне новый код авторизации интеграции?" +
            "\n/integrationCode")
    }
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}


async function onLaunchJobs() {
    console.log('checking for access to amocrm')
    const access = await crmDataService.checkIfAccessGranted()
    console.log(access)
    if (!access)
        await notifyAdminAboutAccessError()
}

module.exports = {
    bot,
    admins
}
