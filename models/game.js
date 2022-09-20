const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
    p1score: Number,
    p2score: Number,
    date: Date
});

module.exports = mongoose.model("Game", gameSchema);

