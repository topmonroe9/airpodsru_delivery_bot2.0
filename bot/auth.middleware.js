const {User} = require("../models/users");

const admins = [
    {username: 'top_monroe', chatId: 1140018575}
]

const auth = () => (ctx, next) => {
    ctx.state.user = getUser(ctx.message)
    return next()
}

async function getUser(message) {
    const user = await User.findOne({ username: message.from.username })
    return user
}

module.exports = auth
