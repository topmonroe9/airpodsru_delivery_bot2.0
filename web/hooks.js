const express = require('express');
const router = express.Router();
const EventBus = require('../eventBus')


router.post('/courier-assigned', onCourierAssigned);
router.post('/return-created', onReturnCreated);

function onCourierAssigned(req, res) {
    console.log('received hook for courier-assigned')
    EventBus.emit('courier-assigned', req.body)
    res.sendStatus(200)
}

function onReturnCreated(req, res) {
    console.log('received hook for return-created')
    EventBus.emit('return-created', req.body)
    res.sendStatus(200)
}

function leadChanged(req, res) {
    console.log('received hook for courier-assigned')
    // EventBus.emit('return-created', req.body)
    res.sendStatus(200)
}

module.exports = router;
