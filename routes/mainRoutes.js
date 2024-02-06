const express = require('express');
const controller = require('./../controllers/mainControllers');
const router = express.Router();

router.get('/', controller.getHome);
router.get('/dailylog/new', controller.getAddNewLog);
router.get('/login', controller.getLogin);
router.get('/register', controller.getRegister);
router.post('/login', controller.postLogin)
/*router.get('/edit/:id', controller.selectLog);

router.get('/logout', controller.getLogout);

router.post('/new', controller.postNewRun);
router.post('/edit/:id', controller.updateRun);
router.post('/del/:id', controller.deleteRun);
;
*/
module.exports = router;