const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const upload = require("../middleware/upload");

const {
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  confirmDeletion,
  getWorkspace,
  getWorkspaces,
  inviteMember,
  modifyMember,
  acceptInvitation,
  removeMember,
} = require("../controllers/workspace.controller");

const {
  createDatasource,
  deleteDatasource,
  updateDatasource,
  listDatasources,
  getDatasource,
  testDatasource,
} = require("../controllers/datasource.controller");

const {
  addESSetting,
  updateESSettings,
  deleteESSetting,
  getESSetting,
  listESSettings,
  testESSettings,
} = require("../controllers/es.controller");

const {
  createFolder,
  getFolder,
  updateFolder,
  deleteFolder,
  listFolders,
  allAlerts,
} = require("../controllers/folder.controller");

const {
  addModel,
  updateModel,
  getModel,
  listModels,
  deleteModel,
} = require("../controllers/model.controller");

const {
  addVectorStore,
  updateVectorStore,
  getVectorStore,
  listVectorStores,
  deleteVectorStore,
} = require("../controllers/vs.controller");

// done till here
const {
  createAlert,
  getAlert,
  listAlerts,
  updateAlert,
  deleteAlert,
  confirmAlertDeletion,
  pauseAlert,
  runAlert,
  assignUser,
  unassignUser,
  subscribeToAlert,
  unsubscribeFromAlert,
  getAlertResults,
  getAlertResult,
  takeActionOnResult,
  addNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  pauseExecution,
  getVersions,
  rollbackVersion,
  deleteVersion,
  getStats,
} = require("../controllers/alert.controller");

const {
  createWorkflow,
  updateWorkflow,
  listWorkflows,
  getWorkflow,
  deleteWorkflow,
} = require("../controllers/workflow.controller");

// Workspace routes
router.post("/", authenticateToken, createWorkspace);
router.put("/:workspaceId", authenticateToken, updateWorkspace);
router.delete("/:workspaceId", authenticateToken, deleteWorkspace);
router.post(
  "/:workspaceId/confirm_deletion",
  authenticateToken,
  confirmDeletion,
);
router.get("/:workspaceId", authenticateToken, getWorkspace);
router.get("/", authenticateToken, getWorkspaces);
router.post("/:workspaceId/invite", authenticateToken, inviteMember);
router.delete("/:workspaceId/remove_member", authenticateToken, removeMember);
router.put("/:workspaceId/modify_member", authenticateToken, modifyMember);
router.put("/:workspaceId/accept_invite", acceptInvitation);

// Folder routes
router.post("/:workspaceId/f", authenticateToken, createFolder);
router.put("/:workspaceId/f/:folderId", authenticateToken, updateFolder);
router.get("/:workspaceId/f/:folderId", authenticateToken, getFolder);
router.delete("/:workspaceId/f/:folderId", authenticateToken, deleteFolder);
router.get("/:workspaceId/f", authenticateToken, listFolders);
router.get("/:workspaceId/f/:folderId/alerts", authenticateToken, allAlerts);

// Datasource routes
router.post(
  "/:workspaceId/ds",
  upload,
  authenticateToken,
  createDatasource,
);
router.delete(
  "/:workspaceId/ds/:datasourceId",
  authenticateToken,
  deleteDatasource,
);
router.put(
  "/:workspaceId/ds/:datasourceId",
  authenticateToken,
  updateDatasource,
);
router.get("/:workspaceId/ds", authenticateToken, listDatasources);
router.get("/:workspaceId/ds/:datasourceId", authenticateToken, getDatasource);
router.post(
  "/:workspaceId/ds/:datasourceId/test",
  authenticateToken,
  testDatasource,
);

// ES routes
router.post("/:workspaceId/es", authenticateToken, addESSetting);
router.put(":workspaceId/es/:esSettingId", authenticateToken, updateESSettings);
router.delete(
  "/:workspaceId/es/:esSettingId",
  authenticateToken,
  deleteESSetting,
);
router.get(":workspaceId/es/:esSettingId", authenticateToken, getESSetting);
router.get("/:workspaceId/es", authenticateToken, listESSettings);
router.post(
  "/:workspaceId/es/:esSettingId/test",
  authenticateToken,
  testESSettings,
);

// Model routes
router.post("/:workspaceId/m", authenticateToken, addModel);
router.put("/:workspaceId/m/:modelId", authenticateToken, updateModel);
router.get("/:workspaceId/m", authenticateToken, listModels);
router.get("/:workspaceId/m/:modelId", authenticateToken, getModel);
router.delete("/:workspaceId/m/:modelId", authenticateToken, deleteModel);

// Vector Store routes
router.post("/:workspaceId/vs", authenticateToken, addVectorStore);
router.put(
  "/:workspaceId/vs/:vectorStoreId",
  authenticateToken,
  updateVectorStore,
);
router.get("/:workspaceId/vs", authenticateToken, listVectorStores);
router.get(
  "/:workspaceId/vs/:vectorStoreId",
  authenticateToken,
  getVectorStore,
);
router.delete(
  "/:workspaceId/vs/:vectorStoreId",
  authenticateToken,
  deleteVectorStore,
);

// Workflow routes
router.post("/:workspaceId/w", authenticateToken, createWorkflow);
router.put("/:workspaceId/w/:workflowId", authenticateToken, updateWorkflow);
router.get("/:workspaceId/w", authenticateToken, listWorkflows);
router.get("/:workspaceId/w/:workflowId", authenticateToken, getWorkflow);
router.delete("/:workspaceId/w/:workflowId", authenticateToken, deleteWorkflow);

// Alert routes
router.post("/:workspaceId/f/:folderId/a/", authenticateToken, createAlert);
router.get("/:workspaceId/f/:folderId/a/:alertId", authenticateToken, getAlert);
router.get("/:workspaceId/f/:folderId/a/", authenticateToken, listAlerts);
router.put("/:workspaceId/f/:folderId/a/:alertId", authenticateToken, updateAlert);
router.delete("/:workspaceId/f/:folderId/a/:alertId", authenticateToken, deleteAlert);
router.post(
  "/:workspaceId/f/:folderId/a/:alertId/confirm_deletion",
  authenticateToken,
  confirmAlertDeletion,
);
router.put("/:workspaceId/f/:folderId/a/:alertId/pause", authenticateToken, pauseAlert);
router.put("/:workspaceId/f/:folderId/a/:alertId/run", authenticateToken, runAlert);
router.post(
  "/:workspaceId/f/:folderId/a/:alertId/subscribe",
  authenticateToken,
  subscribeToAlert,
);
router.post(
  "/:workspaceId/f/:folderId/a/:alertId/unsubscribe",
  authenticateToken,
  unsubscribeFromAlert,
);
router.post(
  "/:workspaceId/f/:folderId/a/:alertId/assign_user",
  authenticateToken,
  assignUser,
);
router.post(
  "/:workspaceId/f/:folderId/a/:alertId/unassign_user",
  authenticateToken,
  unassignUser,
);
router.get(
  "/:workspaceId/f/:folderId/a/:alertId/results/",
  authenticateToken,
  getAlertResults,
);
router.get(
  "/:workspaceId/f/:folderId/a/:alertId/results/:resultId",
  authenticateToken,
  getAlertResult,
);
router.put(
  "/:workspaceId/f/:folderId/a/:alertId/results/:resultId/",
  authenticateToken,
  takeActionOnResult,
);
router.post(
  "/:workspaceId/f/:folderId/a/:alertId/results/:resultId/notes",
  authenticateToken,
  addNote,
);
router.get(
  "/:workspaceId/f/:folderId/a/:alertId/results/:resultId/notes",
  authenticateToken,
  getNotes,
);
router.get(
  "/:workspaceId/f/:folderId/a/:alertId/results/:resultId/notes/:noteId",
  authenticateToken,
  getNote,
);
router.put(
  "/:workspaceId/f/:folderId/a/:alertId/results/:resultId/notes/:noteId",
  authenticateToken,
  updateNote,
);
router.delete(
  "/:workspaceId/f/:folderId/a/:alertId/results/:resultId/notes/:noteId",
  authenticateToken,
  deleteNote,
);
router.put(
  "/:workspaceId/f/:folderId/a/:alertId/skip_query",
  authenticateToken,
  pauseExecution,
);
router.get("/:workspaceId/f/:folderId/a/:alertId/versions", authenticateToken, getVersions);
router.post(
  "/:workspaceId/f/:folderId/a/:alertId/versions/:versionId/rollback",
  authenticateToken,
  rollbackVersion,
);
router.delete(
  "/:workspaceId/f/:folderId/a/:alertId/versions/:versionId",
  authenticateToken,
  deleteVersion,
);
router.get("/:workspaceId/f/:folderId/a/:alertId/stats", authenticateToken, getStats);

module.exports = router;
