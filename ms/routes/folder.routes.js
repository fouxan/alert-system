const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");

const {
    createFolder,
    updateFolder,
    deleteFolder,
    getFolder,
    listFolders,
    allAlerts,
} = require("../controllers/folder.controller");


router.post("/", authenticateToken, createFolder);
router.put("/:folderId", authenticateToken, updateFolder);
router.delete("/:folderId", authenticateToken, deleteFolder);
router.get("/:folderId", authenticateToken, getFolder);
router.get("/", authenticateToken, listFolders);
router.get("/:folderId/alerts", authenticateToken, allAlerts);


module.exports = router;
