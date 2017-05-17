const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);   
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: 'Wex Bos<wesbos@gmail.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text
  };

  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
}

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../view/email/${filename}.pug}`, options);
  const inlined = juice(html);
  return inlined;
}

// transport.sendMail({
//   from: 'Wex Bos<wesbos@gmail.com>',
//   to: 'randy@example.com',
//   subject: 'Just trying things out',
//   html: 'Hey I <strong>love</strong> you',
//   text: 'Hey I **love you**'
// });

