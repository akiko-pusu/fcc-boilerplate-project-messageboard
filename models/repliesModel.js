const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Hold the sequencial number. (MongoDB default _id is based on hash.)
const AutoIncrement = require('mongoose-sequence')(mongoose);

const replySchema = new Schema({
  id: { type: Number },
  thread_id: {
    type: Number, required: true
  },
  text: { type: String },
  created_on: {
    type: Date
  }, // "Sat Sep 26 2020",  // Format Changed with toDateString()
  bumped_on: {
    type: Date
  },
  delete_password: {
    type: String, required: true
  },
  reported: { type: Boolean }
});

replySchema.plugin(AutoIncrement, { id: 'reply_id_counter', inc_field: 'id' });
const Reply = mongoose.model('Reply', replySchema);

module.exports = Reply;
