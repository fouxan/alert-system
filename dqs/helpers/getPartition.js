const mapActionTypeToPartition = (actionType) => {
    switch (actionType) {
        case "email":
            return 0;
        case "slack":
            return 1;
        case "webex":
            return 2;
        case "webhook":
            return 3;
        default:
            return 0;
    }
};

module.exports = mapActionTypeToPartition;