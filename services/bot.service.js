const moment = require('moment-timezone')
moment.locale('ru');
const axios = require('axios')
const EventBus = require('../eventBus')
const _ = require('lodash')
const crmidcfg = require('./crm-id-cfg.json')

module.exports = {
    sendNewOrderToCoruier,
    sendOrderDetailsToCourier,
    sendErrorMessage,
    sendUpdatedOrderToCourier,
}

function newOrderMessage(data) {
    let msg = ''
    data.updating ? msg += '⚠ ♻ Этот заказ обновлен\n' : null
    if (data.delivery_type === 'courier') {
        msg += !data.is_return ? `📦 <b>Новый заказ на доставку</b>` : `⛔ <b>Поступила заявка на возврат</b>`
        msg += `\n<code>#${data.order_id}</code>\n`
        msg += `\n<b>Адрес:</b> ${data.shipping_address}`
        msg += `\n<b>Состав:</b> ${data.order_items}`
        msg += `\n<b>Коментарий:</b> ${data.comment}`
        msg += `\n<b>Дата доставки:</b> ${toPrettyMscTime(data.shipping_date)}`
    } else if (data.delivery_type === 'sdek') {
        msg += !data.is_return ? `🚛 <b>Новый заказ в пункт СДЭК</b>` : `⛔ <b>Поступила заявка на возврат</b>`
        msg += `\n<code>#${data.order_id}</code>\n`
        msg += `\n<b>№ СДЭК:</b> ${data.sdek_id}`
        msg += `\n<b>Состав:</b> ${data.order_items}`
        msg += `\n<b>Адрес:</b> ${data.shipping_address}`
        msg += `\n<b>Коментарий:</b> ${data.comment}`
    }
    return msg
}

async function orderDetailsMessage(data) {
    const link = await createMapLink(data.shipping_address)
    console.log('function orderDetailsMessage')
    let msg = `📍 <b>Адрес назначен</b>\n`
    data.updating ? msg += '⚠ ♻ Этот заказ обновлен\n' : null
    msg += `\n<code>#${data.order_id}</code>\n`
    msg += `\n<b>Имя:</b> ${data.contact_name}`
    msg += `\n<b>Телефон:</b> ${data.contact_phone}`
    msg += `\n<b>Адрес:</b> ${data.shipping_address}`
    msg += `\n<b>Состав:</b> ${data.order_items}`
    msg += `\n<b>Комментарий:</b> ${data.comment}`
    msg += `\n\n<a href="${link}"> 📍 Построить маршрут</a>\n`
    msg += `\n<b>Дата доставки:</b> ${toPrettyMscTime(data.shipping_date)}`
    return msg;
}

function newOrderReplyMarkup(data) {
    return {
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: data.delivery_type === 'courier' ? "Принять" : "✅ Выполнил",
                        callback_data: data.delivery_type === 'courier' ? `ACCEPT_SHIPPING_${data.order_id}` : `SHIPPING_SUCCESS_${data.order_id}`
                    },
                    {
                        text: data.delivery_type === 'courier' ? "Отказаться" : "❌ Отклонить",
                        callback_data: data.delivery_type === 'courier' ? `REJECT_SHIPPING_${data.order_id}` : `REJECT_SHIPPING_${data.order_id}`
                    }
                ]
            ]
        }
    }
}

function orderDetailsReplyMarkup(data) {
    return {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [
                    {text: "✅ Выполнил", callback_data: `SHIPPING_SUCCESS_${data.order_id}`},
                    {text: "❌ Отклонить", callback_data: `REJECT_SHIPPING_${data.order_id}`}
                ]
            ]
        }
    }
}

/**
 * Удаляем предыдущее сообщение и отправляем новый лид.
 * @param prevMessage
 * @returns {Promise<void>}
 */
async function sendUpdatedOrderToCourier(bot, payload) {
    try {
        await bot.telegram.deleteMessage(payload.msgLead.chat_id, payload.msgLead.message_id)
    } catch (e) {
        console.log('cant delete a fuckin meesage')
    }
    payload.crmLead.updating = true
    
    if (payload.crmLead.msg_type === "onNewOrderMsc" || payload.crmLead.msg_type === "onNewOrderSdek"
        || payload.crmLead.msg_type === "onReturnMsc" || payload.crmLead.msg_type === "onReturnSdek")
        await bot.telegram.sendMessage(
            payload.msgLead.chat_id,
            newOrderMessage(payload.crmLead),
            newOrderReplyMarkup(payload.crmLead)
        ).then(ctx => {
            emitMsgSentEvent(ctx, payload.crmLead)
        })

    if ( payload.crmLead.msg_type === "onAcceptedOrderMsc" )
        await bot.telegram.sendMessage(
            payload.msgLead.chat_id,
            await orderDetailsMessage(payload.crmLead),
            orderDetailsReplyMarkup(payload.crmLead)
        ).then(ctx => {
            emitMsgSentEvent(ctx, payload.crmLead)
        })
}

async function sendNewOrderToCoruier(bot, chatId, data) {

    return bot.telegram.sendMessage(chatId, newOrderMessage(data), newOrderReplyMarkup(data))
        .then(ctx => {
            emitMsgSentEvent(ctx, data)
        })
}


async function sendOrderDetailsToCourier(bot, chatId, data) {
// todo удалять строку если отсутствует значение

    await bot.telegram.sendMessage(chatId, await orderDetailsMessage(data), orderDetailsReplyMarkup(data))
        .then(ctx => {
            emitMsgSentEvent(ctx, data)
        })
}

// todo не перемещается после второго

async function sendErrorMessage(chatId, message) {
    await bot.telegram.sendMessage(chatId, message, {parse_mode: "MarkdownV2",})
}

function emitMsgSentEvent(ctx, data) {
    const orderdata = _.pick(data,
        [
            'lead_id', 'status_id', 'pipeline_id', 'created_at',
            'updated_at', 'order_items', 'lead_id', 'shipping_date',
            'shipping_address', 'contact_name', 'contact_phone',
            'sdek_id', 'msg_type', 'comment', 'upcoming_status'
        ])
    const ctxdata =
        {
            message_id: ctx.message_id,
            chat_id: ctx.chat.id,
            username: ctx.chat.username,
            ...orderdata
        }
    EventBus.emit('msg.sent', {...ctxdata})
}


async function createMapLink(address) {

    const YMapsRes = await axios.get('https://geocode-maps.yandex.ru/1.x/', {
        params: {
            apikey: process.env.Y_MAPS_API_KEY,
            geocode: address,
            format: 'json'
        }
    })
    const pos = YMapsRes.data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.replace(' ', ',')
    const link = `https://yandex.ru/maps/?pt=${pos}&z=15.46`

    return link
}

function toPrettyMscTime(dateTime) {
    return moment(dateTime).tz('Europe/Moscow').format('Do MMM YY')
}
