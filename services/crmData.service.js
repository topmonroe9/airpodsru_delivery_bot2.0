const axios = require('axios')
const {Auth} = require("../models/auth");
const EventBus = require('../eventBus')
const moment = require('moment')
const client_id = '562a8b5e-730d-440c-a98a-92cb898d33d7'
const client_secret = 'XYStVkG8Oncer5nqyo0isLPlGTc4EBfIlWbVqGMAadicGYdSOJSE7hT9g60j6pS5'

const amocrm = axios.create({
    baseURL: 'https://crm1airpods.amocrm.ru/',
    timeout: 2000,
});


/**
 * AUTHENTICATION FUNCTIONS HERE
 */
async function fetchAccessTokenFromAccessCode(accessCode = undefined) {
    console.log('running function fetchAccessTokenFromAccessCode()')
    let accessGranted = false

    await amocrm.post(
        'oauth2/access_token',
        {
            client_id: client_id,
            client_secret: client_secret,
            grant_type: "authorization_code",
            code: accessCode,
            redirect_uri: "http://api.airpods-russia.com"
        }
    )
        .then(async res => {
            let auth = await Auth.findOne({key: 1})
            if (!auth)
                auth = new Auth
            auth.access_token = res.data.access_token
            auth.refresh_token = res.data.refresh_token;
            auth.access_expires = new Date(moment().add(1, 'days'))
            auth.refresh_expires = new Date(moment().add(3, 'months'))
            auth.key = 1
            await auth.save()
            accessGranted = true
            console.log(res)
        })
        .catch( err => {
            console.log(err)
            console.log(err.response);
            EventBus.emit('crmdata.auth-err', {msg: err.response})
        });
    return accessGranted
}

async function checkIfAccessGranted() {
    let accessGranted = false
    let token = await Auth.findOne({key: 1})
    // Если токен или рефреш отсутствуют или рефшреш устарел
    if (!token || token.refresh_token === undefined || token.refresh_expires < new Date(Date.now())) {
        console.log('refresh token expired or doesnt exist')
        EventBus.emit('crmdata.auth-err', {msg: 'refresh token expired or doesnt exist'})

        return accessGranted
    }

    // Получить новый токен доступа если старый устарел
    if (!token.access_token || !token.access_token === undefined || token.access_expires < new Date(Date.now())) {
        console.log('refreshing token')
        await refreshToken()
    }

    return accessGranted = true
}

async function refreshToken() {
    let token = await Auth.findOne({key: 1})

    if (token.refresh_token === undefined) {
        EventBus.emit('crmdata.auth-err', {msg: 'Отсутствует рефреш токен. Нужно ввести accessCode'})
        throw new Error("Отсутсвует Рефреш токен")
    }

    // Проверить на истечение срока годности рефреша
    if (token.refresh_expires < new Date(Date.now())) {
        EventBus.emit('crmdata.auth-err', {msg: 'Истек срок годности рефреш токена. Нужно ввести accessCode'})
        throw new Error("Истек срок годности Рефреш токена")
    }

    await amocrm.post(
        '/oauth2/access_token',
        {
            client_id: client_id,
            client_secret: client_secret,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token,
            redirect_uri: "http://api.airpods-russia.com"
        })
        .then(async res => {
            console.log('refreshing token response: ', res.data)

            if (res.status < 200 || res.status > 204) {
                EventBus.emit('crmdata.auth-err', {msg: `Не удалось получить рефреш токен. Код ответа: ${res.status} \n ${res.data}`})
                throw new Error("Не удалось получить рефреш токен. Ответ от сервера: " + res.status)
            }

            token.access_token = res.data.access_token;
            token.refresh_token = res.data.refresh_token;
            token.access_expires = new Date(moment().add(1, 'days'))
            token.refresh_expires = new Date(moment().add(3, 'months'))
            await token.save()
        })
        .catch( err => {
            console.log(err.response.data)
            EventBus.emit('crmdata.auth-err', {msg: `Не удалось выполнить запрос refreshToken(). ${err}` } )
            throw new Error("Не удалось получить рефреш токен: " + err)
        });
}

/**
 * CRM DATA FUNCTIONS
 */

async function getLeadById(leadId) {
    await checkIfAccessGranted()
    return await amocrm.get(`/api/v4/leads/${leadId}?with=contacts`, {
        headers: {'Authorization': `Bearer ${await getAccessToken()}`}
    })
}

async function getContactById(contactId) {
    await checkIfAccessGranted()
    return await amocrm.get(`/api/v4/contacts/${contactId}`, {
        headers: {'Authorization': `Bearer ${await getAccessToken()}`}
    })
}

async function moveLeadToNextStage(lead) {
    await checkIfAccessGranted()
    return await amocrm.patch(`/api/v4/leads/${lead.leadId}`, {
            status_id: lead.newPipeLineStage
        },
        {
            headers: {'Authorization': `Bearer ${await getAccessToken()}`}
        })
}

async function fetchLeadsByTrackingStatuses() {
    await checkIfAccessGranted()

    return await amocrm.get(`/api/v4/leads`,
        {
            headers: {
                'Authorization': `Bearer ${await getAccessToken()}`
            },
            params: {
                "filter[statuses][0][status_id]": 40053640,
            }
        },
    )
}

/**
 * HELPERS FUNCTIONS
 */

async function getAccessToken() {
    let token = await Auth.findOne({key: 1})
    if (token.access_expires < Date.now())
        token = await refreshToken()
    return token.access_token
}


module.exports = {
    getAccessToken,
    fetchAccessTokenFromAccessCode,
    checkIfAccessGranted,
    getLeadById,
    getContactById,
    moveLeadToNextStage,
    fetchLeadsByTrackingStatuses,
}