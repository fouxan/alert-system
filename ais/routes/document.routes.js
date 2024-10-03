const express = require("express");
const router = express.Router();
const {
    uploadDocument,
    chatWithDocument,
} = require("../controllers/document.controller");
const authenticateToken = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/:workspaceId/doc/upload/:temId/:storeId", upload.single("doc"), authenticateToken, uploadDocument);
router.post("/:workspaceId/doc/chat/:llmId/:temId/:storeId/:docId", authenticateToken, chatWithDocument);

module.exports = router;
