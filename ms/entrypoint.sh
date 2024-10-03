#!/bin/sh
set -e

# Ensure the directories exist
mkdir -p /usr/src/app/storage/files /usr/src/app/storage/configs /usr/src/app/storage/logs

# Change ownership of the directories to the node user
chown -R node:node /usr/src/app/storage

# Execute the CMD from the Dockerfile
exec su-exec node "$@"

