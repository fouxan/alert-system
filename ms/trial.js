const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const { config } = require("dotenv");

const TEMPLATE_DIR = path.join(__dirname, "./templates/config");
const CONFIG_DIR =
    "/home/fouxan/Essentials/Freelancing/Alert System/storage/config";

const generateConfigContent = async (templateName, options) => {
    console.log(options);
    const templateFile = path.join(TEMPLATE_DIR, `${templateName}.ejs`);
    if (!fs.existsSync(templateFile)) {
        throw new Error(`Template ${templateName} does not exist`);
    }

    const templateContent = fs.readFileSync(templateFile, "utf8");
    return ejs.render(templateContent, options);
};

const createConfigFile = async (settings) => {
    console.log(settings);
    const { options, workflowId, alertId, sourceType } = settings;
    let configPath;
    if (sourceType === "file") {
        configPath = path.join(CONFIG_DIR, `${alertId}-config.conf`);
    } else {
        configPath = path.join(CONFIG_DIR, `${workflowId}-config.conf`);
    }
    let templateName = sourceType;
    if (options.temId && options.storeId) {
        templateName = "embedding-" + templateName;
    }

    const content = await generateConfigContent(templateName, options);
    console.log(content);

    fs.writeFile(configPath, content, (err) => {
        if (err) {
            console.error(`Failed to write Fluentd config file.`, err);
            return null;
        } else {
            console.log(`Fluentd config file created/updated.`);
            return configPath;
        }
    });
};

const deleteConfigFile = async (workspaceId, sourceId) => {
    let configPath;
    if (sourceId === null) {
        configPath = path.join(CONFIG_DIR, `${workspaceId}-file-config.conf`);
    } else {
        configPath = path.join(
            CONFIG_DIR,
            `${workspaceId}-${sourceId}-config.conf`
        );
    }
    fs.unlink(configPath, (err) => {
        if (err) {
            console.error(
                `Failed to delete Fluentd config file for workspace ${workspaceId}:`,
                err
            );
        } else {
            console.log(
                `Fluentd config file deleted for workspace ${workspaceId}`
            );
        }
    });
};

const handleConfigSetup = async (
    workflowId = null,
    alertId = null,
    variables,
    action
) => {
    let settings = {
        options: variables,
    };
    if (alertId) {
        // alert logs
        settings.sourceType = "file";
        settings.alertId = alertId;
        console.log("Creating config for alert logs");
    } else if (workflowId) {
        // workflow setup
        const { source } = variables;
        if (!source) {
            throw new Error("Source not found");
        }
        settings.sourceType = source.dbType;
        settings.workflowId = workflowId;
    }
    if (action === "create" || action === "refresh") {
        const configPath = await createConfigFile(settings);
        return configPath;
    } else if (action === "delete") {
        await deleteConfigFile(settings);
        return null;
    }
};

const main = async () => {
    handleConfigSetup(
        null,
        12345,
        {
            alertId: 12345,
            tag: `alert.12345`,
            host: "localhost",
            port: 3306,
            indexName: "index",
            tls: false,
            username: "root",
            password: "root",
        },
        "create"
    );
};

main().catch(console.error);
