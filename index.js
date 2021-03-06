if ( process.env.NODE_ENV !== 'production' ) {
    const dotenv = require('dotenv');
    dotenv.config();
}
const express = require('express');
const app = express();
require('./bot/bot');
const mongoose = require('mongoose')

require('./web/express')( app );
const PORT = process.env.PORT
require('./services/updatesChecker')
require('./services/msgSaver.service')

app.listen(PORT, () => console.log(`Server started listening on port ${PORT}...`))

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);

const mongoURI = process.env.MONGO_URI 
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(() => {
        console.log('Couldn\'t connect to MongoDB\nExiting Node ');
        process.exit(1);
    })

