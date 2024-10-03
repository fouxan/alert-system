const mongoose = require("mongoose");
const { Schema } = mongoose;

const DataSourceSchema = new Schema({
    type: {
        type: String,
        enum: ["chat", "schedule", "log"],
        required: true,
    },
    dbType: {
        type: String,
        enum: [
            "bigquery",
            "mysql",
            "postgres",
            "elasticsearch",
            "pubsub",
            "kafka",
        ],
        required: true,
    },
    connectionDetails: {
        type: Schema.Types.Mixed,
    },
    enabled: { type: Boolean, default: true },
    active: { type: Boolean, default: false },
});

const DataSource = mongoose.model("DataSource", DataSourceSchema);

module.exports = DataSource;
