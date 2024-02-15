const express = require('express');
const controller = require('./../controllers/mainControllers');
const router = express.Router();

router.get('/', controller.getHome);
router.get('/dailylog/showall', controller.getLogs);
router.get('/dailylog/new', controller.getAddNewLog);
router.get('/login', controller.getLogin);
router.get('/register', controller.getRegister);
router.post('/login', controller.postLogin);
router.post('/register', controller.postRegister);
router.get('/logout', controller.getLogout);
router.post('/dailylog/new', controller.postNewLog);
router.post('/del/:id', controller.deleteLog);
router.get('/edit/:id', controller.getEditLog);
router.post('/edit/:id', controller.updateLogTriggers);
router.get('/view/:id',controller.selectLog);

module.exports = router;