const zod = require('zod');

const signupBody = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
})

module.exports = {
    signupBody: signupBody,
}