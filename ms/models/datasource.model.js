const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const Schema = mongoose.Schema;

const dataSourceSchema = new mongoose.Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        datasources: [
            {
                type: {
                    type: String,
                    required: true,
                    enum: ["mysql", "postgres", "bigquery", "elasticsearch"],
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
                            this.type === "mysql" || this.type === "postgres"
                        );
                    },
                },
                port: Number,
                databaseName: String,
                user: {
                    type: String,
                    required: function () {
                        return (
                            this.type === "mysql" || this.type === "postgres"
                        );
                    },
                },
                password: {
                    type: String,
                    required: function () {
                        return (
                            this.type === "mysql" || this.type === "postgres"
                        );
                    },
                },
                ssl: Boolean,
                sslCa: {
                    type: String,
                    required: function () {
                        return (
                            this.ssl === true &&
                            (this.type === "mysql" || this.type === "postgres")
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
                        return this.type === "bigquery";
                    },
                },
                privateKey: {
                    type: String,
                    required: function () {
                        return this.type === "bigquery";
                    },
                },
                clientEmail: {
                    type: String,
                    required: function () {
                        return this.type === "bigquery";
                    },
                },
                dataset: {
                    type: String,
                    required: function () {
                        return this.type === "bigquery";
                    },
                },
            },
            { _id: true },
        ],
    },
    { timestamps: true }
);

const encKey = process.env.ENCRYPTION_KEY;
const signKey = process.env.SIGNING_KEY;

dataSourceSchema.plugin(encrypt, {
    encryptionKey: Buffer.from(encKey, "base64"),
    signingKey: Buffer.from(signKey, "base64"),
    encryptedFields: ["password", "privateKey"],
});

const DataSource = mongoose.model("DataSource", dataSourceSchema);

module.exports = DataSource;
