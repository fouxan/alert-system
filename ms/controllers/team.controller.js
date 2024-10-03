const Team = require("../models/team.model");
const User = require("../models/user.model");

exports.createTeam = async (req, res) => {
    const userId = req.user.id;
    const { name, description, members } = req.body;

    try {
        const team = new Team({
            name,
            description,
            creator: userId,
            members: [
                {
                    userId: userId,
                    permissions: "editor",
                },
                ...members,
            ],
        });
        await team.save();

        res.status(201).send({
            message: "Team created successfully.",
            team,
        });
    } catch (error) {
        console.error("Error in creating Team: ", error);
        res.status(500).send({
            message: "Internal error occurred while creating the Team.",
        });
    }
};

exports.getTeam = async (req, res) => {
    const userId = req.user.id;
    const {teamId} = req.params;

    try {
        const team = await Team.findOne({
            _id: teamId,
            "members.userId": userId,
        });
        if (!team) {
            return res.status(404).send({
                message: "Team does not exits or you are not part of this team",
            });
        }

        res.status(200).send({
            team,
        });
    } catch (error) {
        console.error("Error in getting Team: ", error);
        res.status(500).send({
            message: "Internal error occurred while getting the Team.",
        });
    }
};

exports.getAllUsers = async (req, res) => {
    const userId = req.user.id;
    const { teamId } = req.params;
    try {
        const team = await Team.findOne({
            _id: teamId,
            "members.userId": userId,
        });

        if (!team) {
            return res.status(404).send({
                message: "Team does not exits or you are not part of this team",
            });
        }

        const userIds = team.members.map((member) => member.userId);

        const users = await User.find(
            {
                _id: { $in: userIds },
            },
            "name email mobileNumber availabilityDetails"
        ).lean();

        const userDetails = users.map((user) => {
            const member = team.members.find(
                (member) => member.userId.toString() === user._id.toString()
            );
            return {
                ...user,
                permissions: member.permissions,
            };
        });

        res.status(200).json(userDetails);
    } catch (error) {
        console.error("Error in getting all users: ", error);
        res.status(500).send({
            message: "Internal error occurred while getting all the users.",
        });
    }
};

exports.updateTeam = async (req, res) => {
    const userId = req.user.id;
    const { teamId } = req.params;
    const { name, description } = req.body;

    try {
        const team = await Team.findOne({
            _id: teamId,
            "members.userId": userId,
        });
        if (!team) {
            return res.status(404).send({
                message: "Team does not exits or you are not part of this team",
            });
        }

        const userMember = team.members.find(
            (member) => member.userId.toString() === userId
        );
        if (!userMember || userMember.permissions !== "editor") {
            return res.status(403).send({
                message: "You do not have editing privileges for this team",
            });
        }

        if (name) team.name = name;
        if (description) team.description = description;
        await team.save();

        res.status(200).send({
            message: "Team updated successfully.",
            team,
        });
    } catch (error) {
        console.error("Error in updating Team: ", error);
        res.status(500).send({
            message: "Internal error occurred while updating the Team.",
        });
    }
};

exports.addUserToTeam = async (req, res) => {
    const userId = req.user.id;
    const { teamId } = req.params;
    const { newUserId, permissions } = req.body;

    try {
        const team = await Team.findOne({
            _id: teamId,
            "members.userId": userId,
        });
        if (!team) {
            return res.status(404).send({
                message: "Team does not exits or you are not part of this team",
            });
        }

        const userMember = team.members.find(
            (member) => member.userId.toString() === userId
        );
        if (!userMember || userMember.permissions !== "editor") {
            return res.status(403).send({
                message: "You do not have editing privileges for this team",
            });
        }

        const member = {
            userId: newUserId,
            permissions: permissions,
        };
        team.members.push(member);
        await team.save();

        res.status(200).send({
            message: "User added to the Team successfully.",
            team,
        });
    } catch (error) {
        console.error("Error in adding User to Team: ", error);
        res.status(500).send({
            message: "Internal error occurred while adding User to the Team.",
        });
    }
};

exports.removeUserFromTeam = async (req, res) => {
    const userId = req.user.id;
    const { teamId, userIdToRemove } = req.params;

    try {
        const team = await Team.findOne({
            _id: teamId,
            "members.userId": userId,
        });
        if (!team) {
            return res.status(404).send({
                message: "Team does not exits or you are not part of this team",
            });
        }

        const userMember = team.members.find(
            (member) => member.userId.toString() === userId
        );
        if (!userMember || userMember.permissions !== "editor") {
            return res.status(403).send({
                message: "You do not have editing privileges for this team",
            });
        }

        if (team.creator === userIdToRemove) {
            return res.status(400).send({
                message: "You can not remove the creator of the team.",
            });
        }

        team.members = team.members.filter(
            (member) => member.userId.toString() !== userIdToRemove
        );
        await team.save();

        res.status(200).send({
            message: "User removed from the Team successfully.",
            team,
        });
    } catch (error) {
        console.error("Error in removing User from Team: ", error);
        res.status(500).send({
            message:
                "Internal error occurred while removing User from the Team.",
        });
    }
};

exports.modifyUserInTeam = async (req, res) => {
    const userId = req.user.id;
    const { teamId } = req.params;
    const { userIdToModify, newPermissions } = req.body;

    try {
        const team = await Team.findOne({
            _id: teamId,
            "members.userId": userId,
        });

        if (!team) {
            return res.status(404).send({
                message: "Team does not exits or you are not part of this team",
            });
        }

        const userMember = team.members.find(
            (member) => member.userId.toString() === userId
        );
        if (!userMember || userMember.permissions !== "editor") {
            return res.status(403).send({
                message: "You do not have editing privileges for this team",
            });
        }

        if (team.creator.toString() === userIdToModify) {
            return res.status(400).send({
                message: "You can not modify the creator of the team.",
            });
        }

        const member = team.members.find(
            (member) => member.userId.toString() === userIdToModify
        );
        if (!member) {
            return res.status(404).send({
                message: "User is not part of the team",
            });
        }

        member.permissions = newPermissions;
        await team.save();

        res.status(200).send({
            message: "User modified in the Team successfully.",
            team,
        });
    } catch (error) {
        console.error("Error in modifying User in Team: ", error);
        res.status(500).send({
            message:
                "Internal error occurred while modifying User in the Team.",
        });
    }
};

exports.deleteTeam = async (req, res) => {
    const userId = req.user.id;
    const { teamId } = req.params;

    try {
        const team = await Team.findOne({
            _id: teamId,
            creator: userId,
        });
        if (!team) {
            return res.status(404).send({
                message:
                    "Team does not exits or you are not the creator of this team",
            });
        }

        if (userId !== team.creator.toString()) {
            return res.status(403).send({
                message:
                    "You do not have permission to delete this team, only the creator can delete a team",
            });
        }

        await Team.findByIdAndDelete(teamId);

        res.status(200).send({
            message: "Team deleted successfully.",
        });
    } catch (error) {
        console.error("Error in deleting Team: ", error);
        res.status(500).send({
            message: "Internal error occurred while deleting the Team.",
        });
    }
};

exports.allTeams = async (req, res) => {
    const userId = req.user.id;

    try {
        const teams = await Team.find({
            "members.userId": userId,
        });

        res.status(200).send({
            teams,
        });
    } catch (error) {
        console.error("Error in getting all Teams: ", error);
        res.status(500).send({
            message: "Internal error occurred while getting all the Teams.",
        });
    }
};
