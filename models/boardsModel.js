const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const boardSchema = new Schema(
  {
    boardname: { type: String, required: true, unique: true },
  }
);

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
