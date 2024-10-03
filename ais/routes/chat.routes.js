const express = require("express");
const router = express.Router();
const {
    chatWithDatabase,
    chatWithLogs,
} = require("../controllers/chat.controller");
const authenticateToken = require("../middleware/auth");

router.post("/:workspaceId/c/:modelId/db/:sourceId", chatWithDatabase);
router.post("/:workspaceId/c/:modelId/logs/:sourceId", authenticateToken, chatWithLogs);

module.exports = router;
