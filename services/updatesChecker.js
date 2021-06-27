const cron = require('node-cron')
const axios = require('axios')
const crmdataService = require('./crmData.service')
const Message = require('../models/messages')
const EventBus = require('../eventBus')

cron.schedule('0 0/10 * * *', () => {
    console.log('running scheduled cronjob')
   checkForUpdates().then( () => console.log('updates checked') )
 })


async function checkForUpdates() {
    let leads = await crmdataService.fetchLeadsByTrackingStatuses()

    if (leads.length === 0)
        return

    leads = leads.data._embedded.leads

    for ( let i = 0; i <= leads.length; i++ ) {
        const lead = await Message.findOne({ lead_id: leads[i].lead_id })
        if ( lead.updated_at < leads[i].updated_at) {
            console.log('found Updated lead', leads[i].lead_id)
            EventBus.emit('lead.updated',
                {
                    ...leads[i]
                })
        }
    }


}


