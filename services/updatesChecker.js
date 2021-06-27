const cron = require('node-cron')
const axios = require('axios')
const crmdataService = require('./crmData.service')
const Message = require('../models/messages')
const EventBus = require('../eventBus')
const { collectDataFromLead } = require('./events.service')

cron.schedule('* * * * *', () => {
    console.log('running scheduled cronjob')
   checkForUpdates().then( () => console.log('updates checked') )
 })


async function checkForUpdates() {
    let leads = await crmdataService.fetchLeadsByTrackingStatuses()

    if (leads.length === 0)
        return
    leads = leads.data._embedded.leads

    console.log( 'recieved ', leads.length)
    for ( let i = 0; i < leads.length; i++ ) {
        const msgLead = await Message.findOne({ lead_id: leads[i].id })

        if ( !msgLead )
            continue
        const contact = await crmdataService.getContactById(leads[i]._embedded.contacts[0].id)
        const crmLead = collectDataFromLead( leads[i], contact )

        console.log(msgLead.updated_at)
        console.log(crmLead.updated_at)
        if ( msgLead.updated_at < crmLead.updated_at) {
            console.log('found Updated lead', crmLead.lead_id)
            EventBus.emit('lead.updated',
                {
                    crmLead,
                    msgLead
                })
        }
    }


}


