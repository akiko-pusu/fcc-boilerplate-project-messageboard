const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Hold the sequencial number. (MongoDB default _id is based on hash.)
const AutoIncrement = require('mongoose-sequence')(mongoose);

const threadSchema = new Schema({
  id: { type: Number },
  boardname: {
    type: String, required: true
  },
  created_on: {
    type: Date
  }, // "Sat Sep 26 2020",  // Format Changed with toDateString()
  bumped_on: {
    type: Date
  },
  text: { type: String },
  delete_password: {
    type: String, required: true
  },
  reported: { type: Boolean }
});

threadSchema.plugin(AutoIncrement, { id: 'thread_id_counter', inc_field: 'id' });
const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;
