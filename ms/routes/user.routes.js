const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/auth");
const {
    createUser,
    login,
    getUser,
    updateUser,
    forgotPassword,
    changePassword,
    updateAvailability,
    getContactDetails,
} = require("../controllers/user.controller");

router.post("/register", createUser);
router.post("/login", login);
router.post("/forgot_password", forgotPassword);
router.post("/change_password", authenticateToken, changePassword);
router.get("/me", authenticateToken, getUser);
// router.delete("/cancel_plan", authenticateToken, cancelPlan);
router.post("/update_user", authenticateToken, updateUser);
router.post("/update_availability", authenticateToken, updateAvailability);
router.get("/contact_details", authenticateToken, getContactDetails)
// router.post("/change_plan", authenticateToken, changePlan);

module.exports = router;

