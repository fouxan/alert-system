const fs = require("fs");
const path = require("path");
const Workspace = require("../models/workspace.model");

//TODO: Adjust directory as necessary
const CONFIG_DIR = "/path/to/docker/volume/fb_config_files";

// Utility to create a Fluent Bit configuration file
function createConfigFile(workspaceId, settings) {
    const configPath = path.join(CONFIG_DIR, `${workspaceId}-config.conf`);
    const content = generateConfigContent(settings);

    fs.writeFile(configPath, content, (err) => {
        if (err) {
            console.error(
                `Failed to write Fluent Bit config file for workspace ${workspaceId}:`,
                err
            );
        } else {
            console.log(
                `Fluent Bit config file created/updated for workspace ${workspaceId}`
            );
            Workspace.findByIdAndUpdate(
                workspaceId,
                { $set: { configFileCreated: true } },
                { new: true },
                (err, doc) => {
                    if (err) {
                        console.error(
                            `Failed to update config file status in DB for workspace ${workspaceId}:`,
                            err
                        );
                    } else {
                        console.log(
                            `Config file creation status updated in DB for workspace ${workspaceId}`
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
    Flush        1
    Daemon       Off
    Log_Level    info

[INPUT]
    Name        tail
    Path        /path/to/logs/${settings.workspaceId}.log

[OUTPUT]
    Name        es
    Match       *
    Host        ${settings.host}
    Port        ${settings.port}
    Index       ${settings.workspaceId}
    Type        log
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

        createConfigFile(workspaceId, {
            host: workspace.ESSettings.host,
            port: workspace.ESSettings.port,
            username: workspace.ESSettings.username,
            password: workspace.ESSettings.password,
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
