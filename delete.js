const bcrypt = require("bcryptjs")

const email ="girirajsahu"
const salt = bcrypt.genSaltSync(10)
const hashedurl= bcrypt.hashSync(email,salt)
console.log(hashedurl);
const salt2 = bcrypt.genSaltSync(10)
const hashedurl2= bcrypt.hashSync(email,salt)
console.log(hashedurl2);