const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const {
    createTeam,
    getTeam,
    updateTeam,
    deleteTeam,
    addUserToTeam,
    removeUserFromTeam,
    getAllUsers,
    modifyUserInTeam,
    allTeams,
} = require("../controllers/team.controller");

router.post("/create", authenticateToken, createTeam);
router.get("/get/:teamId", authenticateToken, getTeam);
router.put("/update/:teamId", authenticateToken, updateTeam);
router.delete("/delete/:teamId", authenticateToken, deleteTeam);
router.post("/add_user/:teamId", authenticateToken, addUserToTeam);
router.delete(
    "/remove_user/:teamId/:userIdToRemove",
    authenticateToken,
    removeUserFromTeam
);
router.get("/users/:teamId", authenticateToken, getAllUsers);
router.put("/modify_user/:teamId", authenticateToken, modifyUserInTeam);
router.get("/all", authenticateToken, allTeams);

module.exports = router;

