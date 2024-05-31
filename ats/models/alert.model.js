const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dbSettingsSchema = new Schema(
    {
        dbId: { type: Schema.Types.ObjectId, ref: "Database", required: true },
        query: { type: String, required: true },
    },
    { _id: false }
);

const scheduleSchema = new Schema(
    {
        scheduleType: {
            type: String,
            required: true,
            enum: ["scheduled", "realtime"],
        },
        frequency: {
            type: Number, // in milliseconds eg every 2 days = 172800000
            required: function () {
                return this.scheduleType === "scheduled";
            },
        },
        realTimes: [
            // has to be the msSinceMidnight
            { day: Number, time: Number }, // {1, 43200000} means 12:00 PM on a monday
        ],
        expiry: { type: Date }, // None or timestamp
    },
    { _id: false }
);

const conditionSchema = new Schema(
    {
        trigger: { type: String, enum: ["num_results"], deault: "num_result" },
        triggerThreshold: Number, // 10
        triggerSchedule: {
            type: String,
            enum: ["once", "every_result"],
            default: "once",
        }, //once or every result
        triggerOptions: {
            throttle: Boolean,
            triggerSuppressTime: {
                type: Number, // has to be milliseconds to stop eg. if 30 mins then 1800000
                required: function () {
                    return this.throttle;
                },
            },
        },
        alertLevels: [
            {
                low: Number,
                medium: Number,
                high: Number,
            },
        ],
        triggerSuppressField: String, // suppress triggers containing this field
    },
    { _id: false }
);

const actionSchema = new Schema(
    {
        actionType: {
            type: String,
            enum: ["email", "slack", "webex", "webhook"],
            required: true,
        },
        actionSettings: {
            email: {
                to: String,
                priority: {
                    type: String,
                    enum: ["low", "medium", "high"],
                    default: "medium",
                },
                subject: {
                    type: String,
                    default: "Alert Notification",
                },
                bodyType: {
                    type: String,
                    enum: ["html", "plain"],
                    default: "html",
                },
                body: String,
                options: {
                    linkToAlert: { type: Boolean, default: false },
                    linkToResults: { type: Boolean, default: false },
                    attachCsv: { type: Boolean, default: false },
                    attachPdf: { type: Boolean, default: false },
                },
            },
            slack: {
                token: String,
                channel: String,
                message: String,
                attachment: String,
                fields: String,
                webhookUrl: String,
            },
            webex: {
                room: String,
                apiKey: String,
                message: String,
                options: {
                    includeFirstRow: Boolean,
                    inludeLinkToResults: Boolean,
                },
            },
            webhook: {
                url: String,
                message: String,
            },
        },
        timeConstraints: [{ day: String, start: Date, end: Date }], // has to be the msSinceMidnight
        showAlertInStatusPage: {
            type: Boolean,
            default: true,
        },
        activeMaintenance: Boolean,
        triggerTimeframe: [
            {
                type: String,
                enum: ["30 mins", "1 hr", "4 hrs", "24 hrs"],
                default: "24 hrs",
            },
            {
                up: Number,
                down: Number,
                warning: Number,
            },
        ],
    },
    { timestamps: true, _id: false }
);

const subscriptionSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        permissions: {
            type: String,
            enum: ["editor", "viewer"],
            default: "viewer",
        },
        alertStatus: {
            type: String,
            enum: ["Up", "Warning", "Down"],
            default: "Up",
        },
        triggerTimeframe: {
            type: String,
            enum: ["30 mins", "1 hr", "4 hrs", "24 hrs"],
            default: "24 hrs",
        },
    },
    { timestamps: true, _id: false }
);

const assignedUserSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        permissions: {
            type: String,
            enum: ["editor", "viewer"],
            default: "editor",
        },
    },
    { _id: false }
);

const assignedTeamSchema = new Schema(
    {
        teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    },
    { _id: false }
);

const alertSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    alerts: [
        {
            alertName: String,
            alertDesc: String,
            nextCheckTime: Date,
            appName: String,
            alertTag: String,
            workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
            folderId: {
                type: Schema.Types.ObjectId,
                ref: "Folder",
                required: true,
            },
            alertIcon: String,
            visibility: {
                type: String,
                enum: ["public", "private"],
                default: "private",
            },
            dbSettings: dbSettingsSchema,
            condition: conditionSchema,
            action: actionSchema,
            schedule: scheduleSchema,
            status: {
                type: String,
                enum: ["running", "incomplete", "expired", "paused"],
                default: "incomplete",
            },
            deleteKey: Number,
            lastCheckTime: Date,
            queryExecStatus: {
                type: String,
                enum: ["pending", "running", "completed", "failed", "paused"],
                default: "pending",
            },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
            assignedUsers: [assignedUserSchema],
            assignedTeams: [assignedTeamSchema], // teams should contain the permission details.
            subscribedUsers: [subscriptionSchema],
        },
    ],
});

const Alert = mongoose.model("Alert", alertSchema);
module.exports = Alert;
