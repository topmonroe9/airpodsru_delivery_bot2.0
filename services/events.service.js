const _ = require('lodash')
const {User} = require("../models/users");
const admins = require('../bot/admins.json')


module.exports = {
    onCourierAssigned,
    shippingAccepted,
    shippingRejected,
    shippingSucceeded,
}

const config = {
    pipelines: {
        sdek: {
            id: 4283047,
            return_status_id: 40095322,
            shipping_succeeded: 40053820,
            awaiting_shipping: 40053823,
            shipping_problems: 40245427,
        },
        courier: {
            id: 4283029,
            return_status_id: 40095319, // на возврате
            shipping_succeeded: 142,
            courier_assigned: 40053817, // Курьер назначен

            awaiting_shipping: 40053640, // ожидается доставка
            shipping_problems: 40053643, // Проблемы с доставкой

        }
    },
    lead: {
        shipping_date: 843497,
        sdek_num: 843793,
        cour_name: 843471,
        order_items: 843837,
        comment: 843821,
        delivery_adr: 843855,
    },
    contact: {
        num: 293753
    }
}

const pipelines = [
    {
        "id": 4283029,
        "name": "Доставка (Москва) (новое)",
        "sort": 7,
        "is_main": false,
        "is_unsorted_on": true,
        "is_archive": false,
        "account_id": 28699234,
        "_links": {
            "self": {
                "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283029"
            }
        },
        "_embedded": {
            "statuses": [
                {
                    "id": 40053634,
                    "name": "Неразобранное",
                    "sort": 10,
                    "is_editable": false,
                    "pipeline_id": 4283029,
                    "color": "#c1c1c1",
                    "type": 1,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283029/statuses/40053634"
                        }
                    }
                },
                {
                    "id": 40053637,
                    "name": "Курьер назначен",
                    "sort": 20,
                    "is_editable": true,
                    "pipeline_id": 4283029,
                    "color": "#deff81",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283029/statuses/40053637"
                        }
                    }
                },
                {
                    "id": 40053640,
                    "name": "Ожидается доставка",
                    "sort": 30,
                    "is_editable": true,
                    "pipeline_id": 4283029,
                    "color": "#87f2c0",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283029/statuses/40053640"
                        }
                    }
                },
                {
                    "id": 40053643,
                    "name": "Проблема с доставкой",
                    "sort": 40,
                    "is_editable": true,
                    "pipeline_id": 4283029,
                    "color": "#ff8f92",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283029/statuses/40053643"
                        }
                    }
                },
                {
                    "id": 40095319,
                    "name": "На возврате",
                    "sort": 50,
                    "is_editable": true,
                    "pipeline_id": 4283029,
                    "color": "#ffdbdb",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283029/statuses/40095319"
                        }
                    }
                },
                {
                    "id": 142,
                    "name": "Заказ вручен",
                    "sort": 10000,
                    "is_editable": false,
                    "pipeline_id": 4283029,
                    "color": "#CCFF66",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283029/statuses/142"
                        }
                    }
                },
                {
                    "id": 143,
                    "name": "Удалённые клиенты",
                    "sort": 11000,
                    "is_editable": false,
                    "pipeline_id": 4283029,
                    "color": "#D5D8DB",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283029/statuses/143"
                        }
                    }
                }
            ]
        }
    },
    {
        "id": 4283047,
        "name": "Доставка СДЭК (новое)",
        "sort": 8,
        "is_main": false,
        "is_unsorted_on": true,
        "is_archive": false,
        "account_id": 28699234,
        "_links": {
            "self": {
                "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283047"
            }
        },
        "_embedded": {
            "statuses": [
                {
                    "id": 40053814,
                    "name": "Неразобранное",
                    "sort": 10,
                    "is_editable": false,
                    "pipeline_id": 4283047,
                    "color": "#c1c1c1",
                    "type": 1,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283047/statuses/40053814"
                        }
                    }
                },
                {
                    "id": 40053817,
                    "name": "Курьер назначен",
                    "sort": 20,
                    "is_editable": true,
                    "pipeline_id": 4283047,
                    "color": "#deff81",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283047/statuses/40053817"
                        }
                    }
                },
                {
                    "id": 40053820,
                    "name": "Проверка отправления",
                    "sort": 30,
                    "is_editable": true,
                    "pipeline_id": 4283047,
                    "color": "#fff000",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283047/statuses/40053820"
                        }
                    }
                },
                {
                    "id": 40053823,
                    "name": "Заказ отправлен",
                    "sort": 40,
                    "is_editable": true,
                    "pipeline_id": 4283047,
                    "color": "#87f2c0",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283047/statuses/40053823"
                        }
                    }
                },
                {
                    "id": 40095322,
                    "name": "На возврате",
                    "sort": 50,
                    "is_editable": true,
                    "pipeline_id": 4283047,
                    "color": "#ffdbdb",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283047/statuses/40095322"
                        }
                    }
                },
                {
                    "id": 142,
                    "name": "Заказ получен",
                    "sort": 10000,
                    "is_editable": false,
                    "pipeline_id": 4283047,
                    "color": "#CCFF66",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283047/statuses/142"
                        }
                    }
                },
                {
                    "id": 143,
                    "name": "Заказ отменен",
                    "sort": 11000,
                    "is_editable": false,
                    "pipeline_id": 4283047,
                    "color": "#D5D8DB",
                    "type": 0,
                    "account_id": 28699234,
                    "_links": {
                        "self": {
                            "href": "https://crm1airpods.amocrm.ru/api/v4/leads/pipelines/4283047/statuses/143"
                        }
                    }
                }
            ]
        }
    }
]

async function onCourierAssigned(lead, contact) {
    let data = collectDataFromLead(lead, contact)
    const couriersChatId = await getCourierChatId(data.order_courier)
    return {chatId: couriersChatId, data}
}

async function shippingAccepted(lead, contact) {
    const data = collectDataFromLead(lead, contact)
    const newLeadStageData = {
        leadId: data.order_id,
        newPipeLineStage: getNextPipelineStage(data.pipeline_id)
    }
// 1140018575 - Егор
// 805492500 - Матвей
// 484146291 - Catherine
    let couriersChatId = await getCourierChatId(data.order_courier)
    return {chatId: couriersChatId, data, newLeadStageData}

}

async function shippingRejected(lead, contact) {
    const data = collectDataFromLead(lead, contact)
    const newLeadStageData = {
        leadId: data.order_id,
        newPipeLineStage: data.pipeline_id === config.pipelines.courier.id
            ? config.pipelines.courier.shipping_problems : config.pipelines.sdek.shipping_problems
    }

    let couriersChatId = await getCourierChatId(data.order_courier)

    return {couriersChatId, data, newLeadStageData}
}

async function getCourierChatId(courierName) {
    let courier = await User.findOne({name: courierName})
    if (!courier) {
        courier.chatId = admins[0].chatId
        const message = `❌*ОШИБКА* \nНа доствку назначили курьера ${data.order_courier}` +
            `Я поискал в списке курьеров, который мы с тобой составляли и не нашел такого имени\\.\nЧто делать будем?`
        await botService.sendErrorMessage(admins[0].chatId, message);
    }
    return courier.chatId
}

function shippingSucceeded(lead, contact) {
    const data = collectDataFromLead(lead, contact)
    let newLeadStageData
    if (data.delivery_type === 'courier')
        newLeadStageData = {
            leadId: data.order_id,
            newPipeLineStage: config.pipelines.courier.shipping_succeeded
        }
    else if (data.delivery_type === 'sdek')
        newLeadStageData = {
            leadId: data.order_id,
            newPipeLineStage: config.pipelines.sdek.shipping_succeeded
        }
    else throw new Error("невозможно определить тип доставки")
    return newLeadStageData
}

function collectDataFromLead(lead, contact) {

    let data = {
        lead_id: lead.id,
        pipeline_id: lead.pipeline_id,
        status_id: lead.status_id,
        created_at: lead.created_at, // TODO convert data from UNIX
        updated_at: lead.updated_at,
        delivery_type: defineDeliveryType(lead),
        comment: _.find(lead.custom_fields_values, {field_id: config.lead.comment})?.values[0].value,
        order_items: _.find(lead.custom_fields_values, {field_id: config.lead.order_items})?.values[0].value,
        order_courier: _.find(lead.custom_fields_values, {field_id: config.lead.cour_name})?.values[0].value,
        shipping_date: _.find(lead.custom_fields_values, {field_id: config.lead.shipping_date})?.values[0].value,
        shipping_address: _.find(lead.custom_fields_values, {field_id: config.lead.delivery_adr})?.values[0].value,
        order_id: lead.id,
        contact_name: contact.name,
        contact_phone: _.find(contact.custom_fields_values, {field_id: config.contact.num})?.values[0].value,
        is_return: isReturn(lead),
        sdek_id: _.find(lead.custom_fields_values, {field_id: config.lead.sdek_num})?.values[0].value,
    }

    /**
     * Определяем тип сообщения, который будет отправлен
     * @msg_type: { enum: ['onNewOrderMsc', 'onAcceptedOrderMsc', 'onReturnMsc', 'onNewOrderSdek', 'onReturnSdek' ]},
     */
    if ( data.delivery_type === 'courier' ) {
        data.msg_type = 'onNewOrderMsc'
        if ( data.status_id === config.pipelines.courier.awaiting_shipping )
            data.msg_type = 'onAcceptedOrderMsc'
        if ( data.is_return === true )
            data.msg_type = 'onReturnMsc'
    }
    if ( data.delivery_type === 'sdek' ) {
        if ( data.status_id === config.pipelines.sdek.awaiting_shipping )
            data.msg_type = 'onNewOrderSdek'
        if ( data.is_return === true )
            data.msg_type = 'onNewOrderSdek'
    }

    for (let i in data) {
        if (data[i] === undefined)
            data[i] = 'Нет'
    }
    return data
}

function isReturn(lead) {
    if (lead.status_id === config.pipelines.courier.return_status_id
        || lead.status_id === config.pipelines.sdek.return_status_id)
        return true
    return false
}

function defineDeliveryType(lead) {
    const pipelineId = lead.pipeline_id
    if (pipelineId === config.pipelines.sdek.id)
        return 'sdek'
    if (pipelineId === config.pipelines.courier.id)
        return 'courier'

    throw new Error('Невозможно определить тип доставки, не один ID не подошел')
}

function getNextPipelineStage(pipeline) {
    let newPipelineStage
    if (pipeline && pipeline === config.pipelines.courier.id)
        newPipelineStage = config.pipelines.courier.awaiting_shipping
    else if (pipeline && pipeline === config.pipelines.sdek.id)
        newPipelineStage = config.pipelines.sdek.awaiting_shipping
    else
        throw new Error('Невозможно определить id следующего этапа воронки')
    return newPipelineStage
}
