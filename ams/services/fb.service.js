const fs = require("fs");
const path = require("path");
const Workspace = require("../models/workspace.model");

const CONFIG_DIR = '/app/data';

// Utility to create a Fluent Bit configuration file
function createConfigFile(settings) {
    const configPath = path.join(CONFIG_DIR, `${settings.workspaceId}-config.conf`);
    const content = generateConfigContent(settings);

    fs.writeFile(configPath, content, (err) => {
        if (err) {
            console.error(
                `Failed to write Fluent Bit config file for workspace ${settings.workspaceId}:`,
                err
            );
        } else {
            console.log(
                `Fluent Bit config file created/updated for workspace ${settings.workspaceId}`
            );
            Workspace.findByIdAndUpdate(
                settings.workspaceId,
                { $set: { configFileCreated: true } },
                { new: true },
                (err, doc) => {
                    if (err) {
                        console.error(
                            `Failed to update config file status in DB for workspace ${settings.workspaceId}:`,
                            err
                        );
                    } else {
                        console.log(
                            `Config file creation status updated in DB for workspace ${settings.workspaceId}`
                        );
                    }
                }
            );
        }
    });
}

// Generates the content of the Fluent Bit configuration file based on workspace settings
function generateConfigContent(settings) {
    return `
[SERVICE]
    Flush        5
    Daemon       Off
    Log_Level    info

[INPUT]
    Name        tail
    Path        /var/log/fluentbit/${settings.workspaceId}-logs.log
    Parser      json
    Tag         workspace-${settings.workspaceId}

[OUTPUT]
    Name        es
    Match       ${settings.workspaceId}.logs
    Host        ${settings.host}
    Port        ${settings.port}
    Index       ${settings.esIndex}
    Type        _doc
    HTTP_User   ${settings.username || ""}
    HTTP_Passwd ${settings.password || ""}
    tls         On
    tls.verify  ${settings.skipTlsVerify ? "Off" : "On"}
    `;
}

// Public function to handle the creation or updating of Fluent Bit configuration files
async function handleConfigFiles(workspaceId) {
    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }

        createConfigFile({
            host: workspace.ESSettings.host,
            port: workspace.ESSettings.port,
            username: workspace.ESSettings.username,
            password: workspace.ESSettings.password,
            esIndex: workspace.ESSettings.index,
            workspaceId: workspace._id.toString(),
            skipTlsVerify: workspace.ESSettings.skipTlsVerify,
        });
    } catch (error) {
        console.error(
            `Error handling Fluent Bit config file for workspace ${workspaceId}:`,
            error
        );
    }
}

module.exports = {
    handleConfigFiles,
};
