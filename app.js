

const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv').config({ path: './config.env' });
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const userRouter = require('./routes/userRoutes');
const dailylogRouter = require('./routes/dailylogRoutes');
const path = require('path');
const mysql2 = require('mysql2');
const axios = require('axios');
const ejsMate = require('ejs-mate');
const moment = require('moment');
const helmet = require('helmet');
const bcrypt = require('bcrypt');

const app = express();

app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));



app.use(session({
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: false,
}));


app.use(flash());
app.use(helmet({ contentSecurityPolicy: false }));
app.use((req, res, next) => {
    console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});
app.use('/', userRouter);
app.use('/dailylog', dailylogRouter);
app.set('view engine', 'ejs');
app.engine('ejs', ejsMate);

app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
    console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
});



app.listen(process.env.PORT, (err) => {
    if (err) return console.log(err);

    console.log(`Express listening port ${process.env.PORT}`)
});
