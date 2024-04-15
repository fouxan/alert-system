function isDatasourceComplete(dataSource) {
    const baseRequiredFields = ["type", "name", "password", "user"];
    let areBaseFieldsComplete = baseRequiredFields.every(
        (field) => dataSource[field]
    );

    if (!areBaseFieldsComplete) {
        return false;
    }

    if (["SQL", "PostgreSQL"].includes(dataSource.type)) {
        return dataSource.host && dataSource.databaseName && dataSource.port;
    }

    if (dataSource.type === "BigQuery") {
        return (
            dataSource.projectId &&
            dataSource.privateKey &&
            dataSource.clientEmail &&
            dataSource.dataset
        );
    }

    return false;
}
