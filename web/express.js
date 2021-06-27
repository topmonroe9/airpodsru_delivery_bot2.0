
const bodyParser = require('body-parser');
const hooks = require('./hooks')



module.exports = function(app) {


    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use('/hooks', hooks);

    app.get('/api/health', health)

    app.get("*", (req, res) => {
        res.status(301).redirect("/index.html")
    })

    // app.use(error);
}



async function health(req, res) {
    res.status(200).send('Health is good!')
}
