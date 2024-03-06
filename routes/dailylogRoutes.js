//routes relating to the log entries
const express = require('express');
const controller = require('./../controllers/dailyLogControllers');
const router = express.Router();

router.get('/showall', controller.getLogs);
router.get('/new', controller.getAddNewLog);
router.post('/new', controller.postNewLog);
router.post('/del/:id', controller.deleteLog);
router.get('/edit/:id', controller.getEditLog);
router.post('/edit/:id', controller.updateLogTriggers);
router.get('/view/:id',controller.selectLog);

module.exports = router;