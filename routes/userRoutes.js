//routes relating to user 

const express = require('express');
const controller = require('./../controllers/userControllers');
const router = express.Router();
const { check } = require('express-validator');

router.get('/', controller.getHome);
router.get('/login',controller.getLogin);
router.get('/register', controller.getRegister);
router.post('/login', 
    check('username')
    .exists()
    .isLength({ min: 5 })
    .withMessage('Username must be atleast 5 characters'),
    check('password')
        .exists()
        .isLength({ min: 5 })
        .withMessage('Password must be atleast 5 characters'),
    controller.postLogin);

router.post('/register', check('username')
    .exists()
    .isLength({ min: 5 })
    .withMessage('Username must be atleast 5 characters'),
    check('password')
        .exists()
        .isLength({ min: 5 })
        .withMessage('Password must be atleast 5 characters'),
    check('email')
        .exists()
        .isLength({ min: 5 })
        .withMessage('Email Address must be atleast 5 characters'),
    check('firstname')
        .exists()
        .isLength({ min: 2 })
        .withMessage('first name must be atleast 2 characters'),
     check('lastname')
        .exists()
        .isLength({ min: 2 })
        .withMessage('last name must be atleast 2 characters'),
    
    controller.postRegister);
router.get('/logout', controller.getLogout);
router.get('/account', controller.getMyAccount);
router.post('/deleteAccount', controller.deleteAccount);


module.exports = router;