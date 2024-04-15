const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");

const Schema = mongoose.Schema;

const dataSourceSchema = new mongoose.Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        datasources: [
            {
                type: {
                    type: String,
                    required: true,
                    enum: ["MySQL", "PostgreSQL", "BigQuery"],
                },
                name: { type: String, required: true },
                description: String, // optional
                status: {
                    type: String,
                    enum: ["active", "inactive"],
                    default: "active",
                },
                host: {
                    type: String,
                    required: function () {
                        return (
                            this.type === "MySQL" || this.type === "PostgreSQL"
                        );
                    },
                },
                port: Number,
                databaseName: String,
                user: {
                    type: String,
                    required: function () {
                        return (
                            this.type === "MySQL" || this.type === "PostgreSQL"
                        );
                    },
                },
                password: {
                    type: String,
                    required: function () {
                        return (
                            this.type === "MySQL" || this.type === "PostgreSQL"
                        );
                    },
                },
                ssl: Boolean,
                sslCa: {
                    type: String,
                    required: function () {
                        return (
                            this.ssl === true &&
                            (this.type === "MySQL" ||
                                this.type === "PostgreSQL")
                        );
                    },
                }, // Optional, for PostgreSQL and MySQL
                skipTlsVerify: Boolean, // Optional, for PostgreSQL and MySQL
                executionTimeout: Number,
                schema: String, // Optional, for PostgreSQL and MySQL
                connectionLimit: Number, // Optional, for PostgreSQL and MySQL
                // BigQuery-specific fields
                projectId: {
                    type: String,
                    required: function () {
                        return this.type === "BigQuery";
                    },
                },
                privateKey: {
                    type: String,
                    required: function () {
                        return this.type === "BigQuery";
                    },
                },
                clientEmail: {
                    type: String,
                    required: function () {
                        return this.type === "BigQuery";
                    },
                },
                dataset: {
                    type: String,
                    required: function () {
                        return this.type === "BigQuery";
                    },
                },
            },
        ],
    },
    { timestamps: true }
);

// const encryptionKey = process.env.ENCRYPTION_KEY;
// const signingKey = process.env.SIGNING_KEY;

// dataSourceSchema.plugin(encrypt, {
//     encryptionKey,
//     signingKey,
//     encryptedFields: ["password", "privateKey"],
// });

const DataSource = mongoose.model("DataSource", dataSourceSchema);

module.exports = DataSource;
