const Agenda = require("agenda");
const Job = require("./models/job.model");
const Alert = require("./models/alert.model");
const DataSource = require("./models/datasource.model");
const { sendToKafka } = require("./services/message.service");

const agenda = new Agenda({
  db: { address: process.env.MONGODB_URI, collection: "jobs" },
});

const mapDatabaseTypeToPartition = (type) => {
  switch (type) {
    case "mysql":
      return 0;
    case "mongodb":
      return 1;
    case "postgres":
      return 2;
    case "elasticsearch":
      return 3;
    default:
      return 0;
  }
};

const getCronTime = (day, time) => {
  const hours = Math.floor(time / (60 * 60 * 1000));
  const minutes = Math.floor((time % (60 * 60 * 1000)) / (60 * 1000));
  const dayOfWeek = day % 7;

  return `${minutes} ${hours} * * ${dayOfWeek}`;
};

const isInMaintenanceWindow = (maintenanceWindows, date) => {
  const day = date.getDay();
  const time = date.getHours() * 3600000 + date.getMinutes() * 60000;

  return maintenanceWindows.some(({ day: mwDay, start, end }) => {
    const startTime = new Date(start).getTime() % 86400000; // convert start time to milliseconds since midnight
    const endTime = new Date(end).getTime() % 86400000; // convert end time to milliseconds since midnight

    return mwDay === day && time >= startTime && time <= endTime;
  });
};
const isThrottled = (alert) => {
  if (alert.condition.triggerOptions.throttle) {
    const lastCheck = new Date(alert.lastCheckTime || 0);
    const throttleTime = alert.condition.triggerOptions.triggerSuppressTime;
    return Date.now() < lastCheck.getTime() + throttleTime;
  }
  return false;
};

const initScheduler = async () => {
  await agenda.start();
  console.log("Agenda started");
};

const scheduleJob = async (alert) => {
  let job;
  const { _id: alertId, schedule } = alert;

  if (schedule.scheduleType === "scheduled") {
    job = agenda.create("trigger alert", { alertId });
    const frequencyInMinutes = schedule.frequency / 60000;
    const frequencyLiteral =
      frequencyInMinutes + (frequencyInMinutes === 1 ? " minute" : " minutes");
    job.repeatEvery(frequencyLiteral, { skipImmediate: true });
  } else if (schedule.scheduleType === "realtime") {
    for (const { day, time } of schedule.realTimes) {
      const cronTime = getCronTime(day, time);
      const job = agenda.create("trigger alert", { alertId });
      job.schedule(cronTime);
    }
  }

  if (job) {
    await job.save();
    const jobId = job.attrs._id;
    const nextRunTime = job.attrs.nextRunAt;
    await Job.create({ alertId, jobId, nextRunTime });
  }
};

const unscheduleJob = async (alertId) => {
  const jobs = await Job.find({ alertId });
  for (const job of jobs) {
    await agenda.cancel({ _id: job.jobId });
  }
  await Job.deleteMany({ alertId });
};

agenda.define("trigger alert", async (job, done) => {
  const { alertId } = job.attrs.data;
  const alert = await Alert.findById(alertId);

  if (alert) {
    const now = new Date();

    // Check for throttling
    if (isThrottled(alert)) {
      console.log(`Alert ${alertId} is throttled. Skipping trigger.`);
      done();
      return;
    }

    // Check for maintenance window
    if (isInMaintenanceWindow(alert.action.timeConstraints, now)) {
      console.log(
        `Alert ${alertId} is in maintenance window. Skipping trigger.`,
      );
      done();
      return;
    }

    if (!["pending", "completed"].includes(alert.queryExecStatus)) {
      alert.queryExecStatus = "pending";
      await alert.save();
      return; // skipping any action if the user has paused execution mid way or query is still running
    }

    let message = {
      actionType: alert.action.actionType,
      alertId: alert._id,
    };

    const dbSettings = alert.dbSettings;
    const dataSource = await DataSource.findById(dbSettings.dbId);

    message.dbSettings = {
      ...dataSource.connectionDetails,
      query: dbSettings.query,
    };

    await sendToKafka(
      "triggers",
      [message],
      mapDatabaseTypeToPartition(dataSource.dbType),
    );

    alert.lastCheckTime = now;
    alert.queryExecStatus = "running";
    await alert.save();
  }

  done();
});

module.exports = { initScheduler, scheduleJob, unscheduleJob };
