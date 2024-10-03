const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dbSettingsSchema = new Schema(
  {
    dbId: { type: Schema.Types.ObjectId, required: true },
    query: { type: String, required: true },
  },
  { _id: false },
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
      { day: Number, time: Number }, // {1, 43200000} means 12:00 PM on a Monday
    ],
    expiry: { type: Date }, // None or timestamp
  },
  { _id: false },
);

const conditionSchema = new Schema(
  {
    trigger: { type: String, enum: ["num_results"], default: "num_results" },
    triggerThreshold: Number, // 10
    triggerSchedule: {
      type: String,
      enum: ["once", "every_result"],
      default: "once",
    }, // once or every result
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
  { _id: false },
);

const optionsSchema = new Schema(
  {
    linkToAlert: { type: Boolean, default: false },
    linkToResults: { type: Boolean, default: false },
    attachCsv: { type: Boolean, default: false },
    attachTimestamp: { type: Boolean, default: false },
    attachResults: { type: Boolean, default: false },
    attachResultCount: { type: Boolean, default: false },
    attachName: { type: Boolean, default: false },
    attachStatus: { type: Boolean, default: false },
  },
  { _id: false },
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
        body: String, // this will be the template string with variables marked appropriately.
        options: optionsSchema,
      },
      slack: {
        token: String,
        channel: String,
        message: String,
        options: optionsSchema,
      },
      webex: {
        room: String,
        apiKey: String,
        message: String,
        options: optionsSchema,
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
    triggerTimeframes: [
      {
        timeframe: {
          type: String,
          enum: [
            "15 mins",
            "1 hr",
            "4 hrs",
            "12 hrs",
            "1 day",
            "7 days",
            "14 days",
            "30 days",
          ],
          default: "1 day", // default value
        },
        alertLevels: {
          up: { type: Number, default: 5 }, // default value
          warn: { type: Number, default: 10 }, // default value
          down: { type: Number, default: 15 }, // default value
        },
      },
    ],
  },
  { timestamps: true, _id: false },
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
    contactMethods: {
      email: Boolean,
      slack: { type: Schema.Types.ObjectId },
      webex: { type: Schema.Types.ObjectId },
    },
  },
  { timestamps: true, _id: false },
);

const alertSchema = new Schema({
  folderId: { type: Schema.Types.ObjectId, ref: "Folder", required: true },
  creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  alertName: String,
  alertDesc: String,
  appName: String,
  alertTag: String,
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
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
    enum: ["running", "incomplete", "expired", "paused", "created"],
    default: "incomplete",
  },
  deleteKey: Number,
  lastCheckTime: Date,
  queryExecStatus: {
    type: String,
    enum: ["pending", "running", "failed", "paused"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  assignedUsers: [subscriptionSchema],
  subscribedUsers: [subscriptionSchema],
  runningStatuses: [
    {
      timeframe: {
        type: String,
        enum: [
          "15 mins",
          "1 hr",
          "4 hrs",
          "12 hrs",
          "1 day",
          "7 days",
          "14 days",
          "30 days",
        ],
        default: "1 day",
      },
      status: {
        type: String,
        enum: ["Up", "Warn", "Down"],
        default: "Up",
      },
    },
  ],
});

const DEFAULT_TRIGGER_TIMEFRAMES = [
  {
    timeframe: "15 mins",
    alertLevels: { up: 5, warn: 10, down: 15 },
  },
  {
    timeframe: "1 hr",
    alertLevels: { up: 10, warn: 20, down: 30 },
  },
  {
    timeframe: "4 hrs",
    alertLevels: { up: 20, warn: 40, down: 60 },
  },
  {
    timeframe: "12 hrs",
    alertLevels: { up: 30, warn: 60, down: 90 },
  },
  {
    timeframe: "1 day",
    alertLevels: { up: 40, warn: 80, down: 120 },
  },
  {
    timeframe: "7 days",
    alertLevels: { up: 50, warn: 100, down: 150 },
  },
  {
    timeframe: "14 days",
    alertLevels: { up: 60, warn: 120, down: 180 },
  },
  {
    timeframe: "30 days",
    alertLevels: { up: 70, warn: 140, down: 210 },
  },
];

alertSchema.pre("save", function (next) {
  if (!this.action.triggerTimeframes) {
    this.action.triggerTimeframes = [];
  }

  const existingTimeframes = this.action.triggerTimeframes.map(
    (tf) => tf.timeframe,
  );

  const missingTimeframes = DEFAULT_TRIGGER_TIMEFRAMES.filter(
    (defaultTf) => !existingTimeframes.includes(defaultTf.timeframe),
  );

  this.action.triggerTimeframes = [
    ...this.action.triggerTimeframes,
    ...missingTimeframes,
  ];

  // Initialize runningStatuses
  if (!this.runningStatuses || this.runningStatuses.length === 0) {
    this.runningStatuses = this.action.triggerTimeframes.map((tf) => ({
      timeframe: tf.timeframe,
      status: "Up",
    }));
  } else {
    const existingStatuses = this.runningStatuses.map((rs) => rs.timeframe);
    const missingStatuses = this.action.triggerTimeframes
      .filter((tf) => !existingStatuses.includes(tf.timeframe))
      .map((tf) => ({
        timeframe: tf.timeframe,
        status: "Up",
      }));
    this.runningStatuses = [...this.runningStatuses, ...missingStatuses];
  }

  next();
});

const Alert = mongoose.model("Alert", alertSchema);
module.exports = Alert;
