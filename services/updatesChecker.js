const cron = require('node-cron')
const axios = require('axios')
const crmdataService = require('./crmData.service')
const Message = require('../models/messages')
const EventBus = require('../eventBus')
const {collectDataFromLead} = require('./events.service')
const _ = require('lodash')


cron.schedule('* * * * *', () => {
    checkForUpdates().then(() => console.log('updates checked'))
})


async function checkForUpdates() {
    let leads = await crmdataService.fetchLeadsByTrackingStatuses()

    if (leads.length === 0)
        return

    leads = leads.data._embedded.leads

    console.log('Checking ', leads.length, ' leads')

    const valuesToCheck = [
        'status_id', 'pipeline_id',
        'shipping_date', 'shipping_address',
        'contact_name', 'comment',
        'contact_phone', 'sdek_id',
        'order_items'
    ]

    for (let i = 0; i < leads.length; i++) {
        const msgLead = await Message.findOne({lead_id: leads[i].id})
        if (!msgLead)
            continue
        const contact = await crmdataService.getContactById(leads[i]._embedded.contacts[0].id)
        const crmLead = collectDataFromLead(leads[i], contact)

        if (msgLead.updated_at > crmLead.updated_at)
            continue

        for (const prop in crmLead) {

            if (valuesToCheck.includes(prop)) {

                if (crmLead[prop] != msgLead[prop]) {
                    console.log('Comparing crmLead & msgLead: not equeal: ', crmLead.lead_id, prop, crmLead[prop], msgLead[prop])
                    EventBus.emit('lead.updated',
                        {
                            crmLead,
                            msgLead
                        })
                    break
                }
            }
        }
    }

}

//
// for (let i = 0; i < leads.length; i++) {
//     const msgLead = await Message.findOne({lead_id: leads[i].id})
//
//     if (!msgLead)
//         continue
//     const contact = await crmdataService.getContactById(leads[i]._embedded.contacts[0].id)
//     const crmLead = collectDataFromLead(leads[i], contact)
//
//     console.log(msgLead.updated_at)
//     console.log(crmLead.updated_at)
//     if (msgLead.updated_at < crmLead.updated_at) {
//         console.log('found Updated lead', crmLead.lead_id)
//         EventBus.emit('lead.updated',
//             {
//                 crmLead,
//                 msgLead
//             })
//     }
// }



