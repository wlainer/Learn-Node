const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');


const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trin: true,
    validate: [validator.isEmail, 'Invalid email Address'],
    required: 'Please Supply an email address'
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trin: true
  }
});

userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);