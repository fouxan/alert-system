const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/auth");

const {
    createDataSource,
    updateDataSource,
    deleteDataSource,
    getAllDataSources,
    getDataSource,
    // testDataSource
} = require('../controllers/datasource.controller');

router.post('/', authenticateToken, createDataSource);
router.put('/:datasourceId', authenticateToken, updateDataSource);
router.get('/', authenticateToken, getAllDataSources);
router.get('/:datasourceId', authenticateToken, getDataSource);
router.delete('/:datasourceId', authenticateToken, deleteDataSource);


module.exports = router;