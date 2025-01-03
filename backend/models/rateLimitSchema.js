// models/rateLimitSchema.js
const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  timestamp: { type: Number, default: Date.now },
});

module.exports = mongoose.model("RateLimit", rateLimitSchema);
