const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const {
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspace,
    getWorkspaces,
    inviteMember,
    modifyMember,
    acceptInvitation,
    removeMember,
    listFolders,
} = require("../controllers/workspace.controller");

router.post("/", authenticateToken, createWorkspace);
router.put("/:workspaceId", authenticateToken, updateWorkspace);
router.delete("/:workspaceId", authenticateToken, deleteWorkspace);
router.get("/:workspaceId", authenticateToken, getWorkspace);
router.get("/", authenticateToken, getWorkspaces);
router.post("/:workspaceId/invite_member", authenticateToken, inviteMember);
router.delete("/:workspaceId/remove_member", authenticateToken, removeMember);
router.put("/:workspaceId/modify_member", authenticateToken, modifyMember);
router.put("/:workspaceId/accept_invitation",acceptInvitation);
router.get("/:workspaceId/list_folders", authenticateToken, listFolders);

module.exports = router;
