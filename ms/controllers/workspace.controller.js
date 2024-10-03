const jwt = require("jsonwebtoken");
const Workspace = require("../models/workspace.model");
const User = require("../models/user.model");
const Alert = require("../models/alert.model");
const Folder = require("../models/folder.model");
const { sendEmail } = require("../services/email.service");

exports.createWorkspace = async (req, res) => {
	const { name, desc, dataRetentionPeriod } = req.body;
	const userId = req.user.id;

	if (!name) {
		return res.status(400).json({
			error: "Missing required fields: Name",
		});
	}

	try {
		const workspace = new Workspace({
			name,
			desc,
			members: [{ userId, role: "creator" }],
		});
		if (dataRetentionPeriod) {
			workspace.dataRetention = {
				period: dataRetentionPeriod,
				endTime: Date.now() + dataRetentionPeriod * 24 * 60 * 60 * 1000, // Convert days to milliseconds
			};
		} else {
			workspace.dataRetention = {
				period: 30,
				endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
			};
		}
		await workspace.save();

		res.status(201).json({ workspace });
	} catch (error) {
		console.error("Error creating workspace: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.updateWorkspace = async (req, res) => {
	const { name, desc, dataRetentionPeriod } = req.body;
	const { workspaceId } = req.params;
	const userId = req.user.id;

	if (!workspaceId) {
		return res.status(400).json({ error: "Workspace ID is required." });
	}

	try {
		const workspace = await Workspace.findById(workspaceId).exec();
		if (!workspace) {
			return res.status(404).json({ error: "Workspace not found" });
		}

		const userRole = workspace.members.find(
			(member) => member.userId.toString() === userId
		)?.role;
		if (!userRole || userRole === "viewer") {
			return res.status(403).json({
				message: "You do not have permission to update this workspace.",
			});
		}

		workspace.name = name || workspace.name;
		workspace.desc = desc || workspace.desc;
		if (dataRetentionPeriod) {
			workspace.dataRetention = {
				period: dataRetentionPeriod,
				endTime: Date.now() + dataRetentionPeriod * 24 * 60 * 60 * 1000, // Convert days to milliseconds
			};
		}

		await workspace.save();
		res.json({ message: "Workspace updated successfully.", workspace });
	} catch (error) {
		console.error("Error updating workspace: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.deleteWorkspace = async (req, res) => {
	const { workspaceId } = req.params;
	const userId = req.user.id;

	try {
		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res.status(404).json({ error: "Workspace not found" });
		}
		if (
			!workspace.members.some(
				(m) => m.userId.equals(userId) && m.role === "creator"
			)
		) {
			return res
				.status(403)
				.json({ error: "Not a creator/editor of this workspace" });
		}
		const creatorId = workspace.members.find(
			(m) => m.role === "creator"
		).userId;
		if (!creatorId) {
			return res
				.status(403)
				.json({ error: "No creator found for this workspace" });
		}
		const creator = await User.findById(creatorId, "email");

		const requester = await User.findById(userId, "username");
		if (!requester) {
			return res.status(404).json({ message: "Requester not found." });
		}

		const OTP = Math.floor(1000 + Math.random() * 9000);
		workspace.deleteKey = OTP;
		await workspace.save();

		await sendEmail({
			to: creator.email,
			subject: `Confirm Workspace Deletion || ${workspace.name}`,
			templateName: "confirm-deletion",
			variables: {
				delete_type: "workspace",
				requested_by: requester.username,
				entity_name: workspace.name,
				otp: OTP,
			},
		});

		res.json({
			message: "Confirmation email sent to creator of the workspace",
		});
	} catch (error) {
		console.error("Error deleting workspace: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.confirmDeletion = async (req, res) => {
	const { workspaceId } = req.params;
	const { otp } = req.body;
	const userId = req.user.id;
	try {
		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res.status(404).json({ message: "Workspace not found." });
		}

		if (workspace.deleteKey !== otp) {
			return res.status(400).json({ message: "Invalid OTP." });
		}

		const creatorId = workspace.members
			.find((m) => m.role === "creator")
			.userId.toString();
		if (creatorId !== userId) {
			return res.status(403).json({
				message: "You are not authorized to delete this workspace.",
			});
		}

		const workspaceFolder = await Folder.findOne({ workspaceId }).lean();
		if (workspaceFolder) {
			for (const folder of workspaceFolder.folders) {
				await Alert.deleteMany({ folderId: folder._id });
			}
			await Folder.deleteOne({ workspaceId });
		}

		await workspace.remove();

		res.json({
			message: "Workspace and all related data have been successfully deleted.",
		});
	} catch (error) {
		console.error("Error in confirming deletion", error);
		res.status(500).json({ error: error.message });
	}
};

exports.getWorkspace = async (req, res) => {
	const { workspaceId } = req.params;
	const userId = req.user.id;

	try {
		const workspace = await Workspace.findById(workspaceId).exec();
		if (!workspace) {
			return res.status(404).json({ error: "Workspace not found" });
		}
		if (!workspace.members.find((m) => m.userId.equals(userId))) {
			return res.status(403).json({ error: "Not a member of this workspace" });
		}
		res.json({ workspace });
	} catch (error) {
		console.error("Error getting WS: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.getWorkspaces = async (req, res) => {
	const userId = req.user.id;

	try {
		const workspaces = await Workspace.find({
			"members.userId": userId,
		}).exec();
		res.json({ workspaces });
	} catch (error) {
		console.error("Error getting WS: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.listFolders = async (req, res) => {
	const userId = req.user.id;
	const { workspaceId } = req.params;
	try {
		const workspace = await Workspace.findById(workspaceId).exec();
		if (!workspace) {
			return res.status(404).send({ message: "No workspace found." });
		}

		if (!workspace.members.find((m) => m.userId.equals(userId))) {
			return res.status(403).json({ error: "Not a member of this workspace" });
		}

		const workspaceFolders = await Folder.findOne({ workspaceId }).exec();
		if (!workspaceFolders || workspaceFolders.folders.length === 0) {
			return res
				.status(200)
				.send({ message: "No folders found.", folders: [] });
		}

		res.json({
			message: "Folders retrieved successfully.",
			folders: workspaceFolders.folders,
		});
	} catch (error) {
		console.error("Error in listing folders: ", error);
		res.status(500).send({
			message: "Internal error occurred while listing the folders.",
		});
	}
};

exports.inviteMember = async (req, res) => {
	const { newUserId, role } = req.body;
	const { workspaceId } = req.params;
	const userId = req.user.id;

	try {
		const workspace = await Workspace.findById(workspaceId).exec();
		if (!workspace) {
			return res.status(404).json({ error: "Workspace not found" });
		}

		const userRole = workspace.members.find(
			(member) => member.userId.toString() === userId
		)?.role;
		if (!userRole || userRole === "viewer") {
			return res.status(403).json({
				message: "You do not have permissions to invite members to workspace.",
			});
		}

		if (workspace.members.some((m) => m.userId.equals(newUserId))) {
			return res.status(400).json({ error: "User already a member" });
		}
		if (role === "creator" || !["editor", "viewer"].includes(role)) {
			return res.status(400).json({
				error: "Invalid role. Can be one of editor or viewer",
			});
		}
		if (!User.findById(newUserId)) {
			return res.status(404).json({ error: "User to invite not found" });
		}

		const token = jwt.sign(
			{ workspaceId, newUserId, role },
			process.env.SECRET_KEY,
			{
				expiresIn: "48h",
			}
		);
		const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
		workspace.invitations.push({
			token,
			expiry: expiry,
		});
		await workspace.save();

		const newUser = await User.findById(newUserId).exec();
		const currentUser = await User.findById(userId).exec();
		const formattedDate =
			expiry.getDate() +
			"/" +
			expiry.getMonth() +
			1 +
			"/" +
			expiry.getFullYear();
		await sendEmail({
			to: newUser.email,
			subject: `Invitation to join workspace: ${workspace.name}`,
			templateName: "accept-invite",
			variables: {
				workspace_name: workspace.name,
				invited_by: currentUser.username,
				user_name: newUser.username,
				token: token,
				expiry: formattedDate,
			},
		});

		res.json({ message: "Invitation sent", token });
	} catch (error) {
		console.error("Error sending invite: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.acceptInvitation = async (req, res) => {
	const { token } = req.body;
	const { workspaceId } = req.params;

	try {
		const decoded = jwt.verify(token, process.env.SECRET_KEY);
		const workspaceIdToJoin = decoded.workspaceId;

		if (workspaceId !== workspaceIdToJoin) {
			return res.status(400).json({ error: "Invalid token" });
		}

		const workspace = await Workspace.findById(workspaceIdToJoin).exec();
		const userId = decoded.newUserId;

		if (!workspace) {
			return res.status(404).json({ error: "Workspace not found" });
		}

		const invitation = workspace.invitations.find((i) => i.token === token);
		if (!invitation) {
			return res.status(404).json({ error: "Invitation not found" });
		}
		if (invitation.expiry < new Date()) {
			return res.status(400).json({ error: "Invitation expired" });
		}
		if (workspace.members.some((m) => m.userId.equals(userId))) {
			return res.status(400).json({ error: "User already a member" });
		}

		workspace.invitations = workspace.invitations.filter(
			(i) => i.token !== token
		);
		workspace.members.push({ userId, role: decoded.role });
		await workspace.save();

		res.json({ message: "Invitation accepted" });
	} catch (error) {
		console.error("Error accepting invite: ", error);
		res.status(500).json({ error: error.message });
	}
};

exports.modifyMember = async (req, res) => {
	const { userIdToModify, newRole } = req.body;
	const workspaceId = req.params.workspaceId;
	const userId = req.user.id;

	try {
		const workspace = await Workspace.findById(workspaceId).exec();
		if (!workspace) {
			return res.status(404).json({ error: "Workspace not found" });
		}
		const userRole = workspace.members.find(
			(member) => member.userId.toString() === userId
		)?.role;
		if (!userRole || userRole === "viewer") {
			return res.status(403).json({
				message: "You do not have permission to update this workspace.",
			});
		}
		const memberIndex = workspace.members.findIndex((m) =>
			m.userId.equals(userIdToModify)
		);
		if (memberIndex === -1) {
			return res.status(404).json({ error: "User not a member" });
		}
		if (newRole === "creator") {
			return res.status(400).json({ error: "Cannot add a creator" });
		}
		workspace.members[memberIndex].role = newRole;
		await workspace.save();
		res.json({ message: "Member modified" });
	} catch (error) {
		console.error("Error modifying member: ", error);
		res.status500.json({ error: error.message });
	}
};

exports.removeMember = async (req, res) => {
	const { userIdToRemove } = req.body;
	const workspaceId = req.params.workspaceId;
	const userId = req.user.id;

	try {
		const workspace = await Workspace.findById(workspaceId).exec();
		if (!workspace) {
			return res.status(404).json({ error: "Workspace not found" });
		}
		const userRole = workspace.members.find(
			(member) => member.userId.toString() === userId
		)?.role;
		if (!userRole || userRole === "viewer") {
			return res.status(403).json({
				message: "You do not have permission to update this workspace.",
			});
		}
		const memberIndex = workspace.members.findIndex((m) =>
			m.userId.equals(userIdToRemove)
		);
		if (memberIndex === -1) {
			return res.status(404).json({ error: "User not a member" });
		}
		if (workspace.members[memberIndex].role === "creator") {
			return res
				.status(403)
				.json({ error: "Can't remove the creator of the workspace" });
		}
		workspace.members.splice(memberIndex, 1);
		await workspace.save();
		res.json({ message: "Member removed" });
	} catch (error) {
		console.error("Error removing member: ", error);
		res.status(500).json({ error: error.message });
	}
};
