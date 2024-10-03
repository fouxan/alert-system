const mongoose = require("mongoose");
const { Schema } = mongoose;

const ESSettingsSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  node: {
    type: String,
    required: this.authType === "node-api" || this.authType === "node-basic",
  }, // omitting port here
  tls: { type: Boolean, default: false },
  cloudId: {
    type: String,
    required: this.authType === "cloud-api" || this.authType === "cloud-basic",
  },
  authType: {
    type: String,
    enum: ["node-api", "node-basic", "cloud-basic", "cloud-api"],
    required: true,
  },
  username: {
    type: String,
    required: function () {
      return this.authType === "basic";
    },
  },
  password: {
    type: String,
    required: function () {
      return this.authType === "basic";
    },
  },
  caFingerprint: {
    type: String,
    required: function () {
      return this.tls && !this.caCert;
    },
  },
  caCert: {
    type: String,
    required: function () {
      return this.tls && !this.caFingerprint;
    },
  },
  rejectUnauthorized: { type: Boolean, default: true },
  api: {
    type: String,
    required: function () {
      return this.authType === "apiKey";
    },
  },
  index: { type: String, required: true },
  isInitialized: { type: Boolean, default: false },
});

const ESSettings = mongoose.model("ESSettings", ESSettingsSchema);

module.exports = ESSettings;
