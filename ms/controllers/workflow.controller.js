const Workspace = require("../models/workspace.model");
const DataSource = require("../models/datasource.model");
const ESSettings = require("../models/es.model");
const Workflow = require("../models/workflow.model");
const { handleConfigSetup } = require("../services/configfile.service");

const removeEmptyFields = (obj) => {
	for (const key in obj) {
		if (
			obj[key] === null ||
			obj[key] === undefined ||
			(Array.isArray(obj[key]) && obj[key].length === 0) ||
			(typeof obj[key] === "object" &&
				!Array.isArray(obj[key]) &&
				Object.keys(obj[key]).length === 0)
		) {
			delete obj[key];
		}
	}
	return obj;
};

exports.createWorkflow = async (req, res) => {
	const { esSettingsId, sourceId, filters, storeId, temId, name, desc } =
		req.body;
	const { workspaceId } = req.params;
	const userId = req.user.id;

	try {
		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res.status(404).json({
				message: "Workspace not found",
			});
		}

		const source = await DataSource.findById(sourceId);
		if (!source) {
			return res.status(404).json({
				message: "Source not found",
			});
		}

		const esSettings = await ESSettings.findById(esSettingsId);
		if (!esSettings) {
			return res.status(404).json({
				message: "ES Settings not found",
			});
		}

		const workflow = await Workflow.create({
			name,
			desc,
			createdBy: userId,
			sourceId,
			esSettingsId,
			filters,
			storeId,
			temId,
			status: "created",
		});

		workspace.workflows.push(workflow._id);
		await workspace.save();

		res.json({
			message: "Workflow created successfully",
			workflow,
		});
	} catch (error) {
		console.error("Error occurred while creating workflow: ", error);
		res.status(500).json({
			message: "Error occurred while creating workflow",
			error,
		});
	}
};

exports.updateWorkflow = async (req, res) => {
	const { esSettingsId, sourceId, filters, storeId, temId, name, desc } =
		req.body;
	const { workspaceId, workflowId } = req.params;

	try {
		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res.status(404).json({
				message: "Workspace not found",
			});
		}

		const workflow = await Workflow.findById(workflowId);
		if (!workflow) {
			return res.status(404).json({
				message: "Workflow not found",
			});
		}

		if (workflow.status !== "paused") {
			return res.status(400).json({
				message: "Workflow must be paused before updating",
			});
		}

		if (sourceId) {
			const source = await DataSource.findById(sourceId);
			if (!source) {
				return res.status(404).json({
					message: "Source not found",
				});
			}
			workflow.sourceId = sourceId;
		}

		if (esSettingsId) {
			const esSettings = await ESSettings.findById(esSettingsId);
			if (!esSettings) {
				return res.status(404).json({
					message: "ES Settings not found",
				});
			}
			workflow.esSettingsId = esSettingsId;
		}

		workflow.name = name || workflow.name;
		workflow.desc = desc || workflow.desc;
		workflow.filters = filters || workflow.filters;
		workflow.storeId = storeId || workflow.storeId;
		workflow.temId = temId || workflow.temId;

		await workflow.save();

		res.json({
			message: "Workflow updated successfully",
			workflow,
		});
	} catch (error) {
		console.error("Error occurred while updating workflow: ", error);
		res.status(500).json({
			message: "Error occurred while updating workflow",
			error,
		});
	}
};

exports.deleteWorkflow = async (req, res) => {
	const { workflowId, workspaceId } = req.params;
	try {
		const workflow = await Workflow.findById(workflowId);
		if (!workflow) {
			return res.status(404).json({
				message: "Workflow not found",
			});
		}

		if (workflow.status !== "paused") {
			return res.status(400).json({
				message: "Workflow must be paused before deleting",
			});
		}

		await Workflow.findByIdAndDelete(workflowId);

		const workspace = await Workspace.findById(workspaceId);
		if (!workspace) {
			return res.status(404).json({
				message: "Workspace not found",
			});
		}

		workspace.workflows = workspace.workflows.filter(
			(id) => id.toString() !== workflowId
		);

		await workspace.save();

		res.json({
			message: "Workflow deleted successfully",
		});
	} catch (error) {
		console.error("Error occurred while deleting workflow: ", error);
		res.status(500).json({
			message: "Error occurred while deleting workflow",
			error,
		});
	}
};

exports.getWorkflow = async (req, res) => {
	const { workflowId } = req.params;
	try {
		const workflow = await Workflow.findById(workflowId);
		if (!workflow) {
			return res.status(404).json({
				message: "Workflow not found",
			});
		}

		res.json({
			workflow,
		});
	} catch (error) {
		console.error("Error occurred while getting workflow: ", error);
		res.status(500).json({
			message: "Error occurred while getting workflow",
			error,
		});
	}
};

exports.listWorkflows = async (req, res) => {
	const { workspaceId } = req.params;
	try {
		const workspace = await Workspace.findById(workspaceId).populate(
			"workflows"
		);
		if (!workspace) {
			return res.status(404).json({
				message: "Workspace not found",
			});
		}

		res.json({
			workflows: workspace.workflows,
		});
	} catch (error) {
		console.error("Error occurred while listing workflows: ", error);
		res.status(500).json({
			message: "Error occurred while listing workflows",
			error,
		});
	}
};

exports.runWorkflow = async (req, res) => {
	const { workflowId } = req.params;

	try {
		const workflow = await Workflow.findById(workflowId);
		if (!workflow) {
			return res.status(404).json({
				message: "Workflow not found",
			});
		}

		const source = await DataSource.findById(workflow.sourceId);
		if (!source) {
			return res.status(404).json({
				message: "Source not found",
			});
		}

		// const esSettings = await ESSettings.findById(workflow.esSettingsId);
		// if (!esSettings) {
		//     return res.status(404).json({
		//         message: "ES Settings not found",
		//     });
		// }

		// const variables = removeEmptyFields({
		//     source,
		//     esSettings,
		//     filters: workflow.filters,
		// });

		const configPath = await handleConfigSetup({
			workflowId: workflow._id,
			variables: workflow.config,
			action: "create",
		});

		workflow.configPath = configPath;
		workflow.status = "running";

		await workflow.save();

		res.json({
			message: "Workflow started successfully",
			workflow,
		});
	} catch (error) {
		console.error("Error occurred while running workflow: ", error);
		res.status(500).json({
			message: "Error occurred while running workflow",
			error,
		});
	}
};

exports.pauseWorkflow = async (req, res) => {
	const { workflowId } = req.params;

	try {
		const workflow = await Workflow.findById(workflowId);
		if (!workflow) {
			return res.status(404).json({
				message: "Workflow not found",
			});
		}

		await handleConfigSetup(workflowId, null, {}, "delete");

		workflow.status = "paused";

		await workflow.save();

		res.json({
			message: "Workflow paused successfully",
			workflow,
		});
	} catch (error) {
		console.error("Error occurred while pausing workflow: ", error);
		res.status(500).json({
			message: "Error occurred while pausing workflow",
			error,
		});
	}
};
