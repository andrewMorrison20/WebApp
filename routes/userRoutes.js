//routes relating to user 

const express = require('express');
const controller = require('./../controllers/userControllers');
const router = express.Router();

router.get('/', controller.getHome);
router.get('/login', controller.getLogin);
router.get('/register', controller.getRegister);
router.post('/login', controller.postLogin);
router.post('/register', controller.postRegister);
router.get('/logout', controller.getLogout);


module.exports = router;