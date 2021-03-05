const nodemailer = require("nodemailer");
const nodemailerStub = require('nodemailer-stub');
const config = require('config')
const DB_CONFIG = config.get('env')

const REAL_TRANSPORT_DATA = {
  host: "in-v3.mailjet.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: '7e0357f156dd64e1bcdac5de848838f7', // generated ethereal user
    pass: 'dbd4b33052744e30640fbd83d88f019b', // generated ethereal password
  },
}

const getTransporter = () => {
  if(DB_CONFIG === 'test') {
    return nodemailerStub.stubTransport
  }

  return REAL_TRANSPORT_DATA
}

const transporter = nodemailer.createTransport(getTransporter());

const FROM = 'Haii-me <support@haii-me.com>'
const DOMEN = 'http://haii-me.com'

const sendVerificationEmail = async ({email, hash}, dev = process.env.NODE_ENV === 'development') => {
  if(dev) {
    return Promise.resolve()
  }
  
  return transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Nice to meet you!",
    html: `<a href="${DOMEN}/verification/${hash}">Click this url to activate your account</a>`,
  })
}

module.exports = {
  sendVerificationEmail
}