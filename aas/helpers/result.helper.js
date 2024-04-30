const ActionResult = require("../models/actionResult.model");

async function storeActionResult(alertId, resultData) {
    try {
        let actionResult = await ActionResult.findOne({ alert_id: alertId });

        if (actionResult) {
            actionResult.results.push(resultData);
        } else {
            actionResult = new ActionResult({
                alert_id: alertId,
                results: [resultData],
            });
        }

        await actionResult.save();
        console.log(`ActionResult stored for alert ${alertId}`);
    } catch (error) {
        console.error("Error storing ActionResult:", error);
    }
}

module.exports = storeActionResult;