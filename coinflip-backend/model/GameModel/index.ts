import mongoose from "mongoose";

const GameSchema = new mongoose.Schema({
  unit: {
    type: String,
    require: true,
  },
  mint: {
    type: String,
    require: true,
  },
  decimal: {
    type: String,
    require: true,
  },
  amount: {
    type: String,
    require: true,
  },
  creator: {
    type: String,
    require: true,
  },
  selection: {
    type: Boolean,
    require: true,
  },
  opposite: {
    type: String,
    default: "",
  },
  gamePDA: {
    type: String,
    default: "",
    unique: true,
  },
  finished: {
    type: Boolean,
    default: false,
  },
  readyToPlay: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Number,
  },
  result: {
    type: Boolean,
    require: true,
  },
  index: {
    type: Number,
    default: 0,
  },
  process: {
    type: Boolean,
    default: false,
  },
  err: {
    type: Boolean,
    default: false,
  },
});

const GameModel = mongoose.model("games", GameSchema);

export default GameModel;
