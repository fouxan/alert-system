const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");

const {
    createAlert,
    getAlert,
    listAlerts,
    updateAlert,
    deleteAlert,
    pauseAlert,
    runAlert,
    assignUser,
    unassignUser,
    assignTeam,
    unassignTeam,
    subscribeToAlert,
    unsubscribeFromAlert,
    takeAction,
} = require("../controllers/alert.controller");

router.post("/", authenticateToken, createAlert);
router.get("/:alertId", authenticateToken, getAlert);
router.get("/", authenticateToken, listAlerts);
router.put("/:alertId", authenticateToken, updateAlert);
router.delete("/:alertId", authenticateToken, deleteAlert);
router.put("/:alertId/pause", authenticateToken, pauseAlert);
router.put("/:alertId/run", authenticateToken, runAlert);
router.post("/:alertId/subscribe", authenticateToken, subscribeToAlert);
router.post("/:alertId/unsubscribe", authenticateToken, unsubscribeFromAlert);
router.post("/:alertId/assign_user", authenticateToken, assignUser);
router.post("/:alertId/unassign_user", authenticateToken, unassignUser);
router.post("/:alertId/assign_team", authenticateToken, assignTeam);
router.post("/:alertId/unassign_team", authenticateToken, unassignTeam);
router.get("/:alertId/results/", authenticateToken, getAlertResults);
router.get("/:alertId/results/:resultId", authenticateToken, getAlertResult);
router.put("/:alertId/results/:resultId/", authenticateToken, takeActionOnResult);
router.post("/:alertId/results/:resultId/notes", authenticateToken, addNote);
router.get("/:alertId/results/:resultId/notes", authenticateToken, getNotes);
router.get("/:alertId/results/:resultId/notes/:noteId", authenticateToken, getNote);
router.put("/:alertId/results/:resultId/notes/:noteId", authenticateToken, updateNote);
router.delete("/:alertId/results/:resultId/notes/:noteId", authenticateToken, deleteNote);


module.exports = router;
