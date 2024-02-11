//if (process.env.NODE_ENV !== "production") {
  //  require('dotenv').config();
//}

const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv').config({ path : './config.env'});
const session = require('express-session');
const router = require('./routes/mainRoutes');
const path = require('path');
const mysql2= require('mysql2');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');

const app = express();

app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));
app.use(flash());

/*const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: false,
  /*  cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }*/


app.use(session({
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: false,
  /*  cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }*/
}));
app.use('/',router);
app.set('view engine','ejs');
app.engine('ejs', ejsMate);

app.set('views', path.join(__dirname, 'views'));


/*app.get('/',(req,res) => {
    res.render('home')
});

app.get('/dailylog/new',(req,res) => {
    res.render('./dailylog/new')
});

app.get('/dailylog/showall',(req,res)=>{
    res.render('./dailylog/show')
})

app.get('/login',(req,res)=>{
    res.render('./users/login')
})

app.get('/register',(req,res)=>{
    res.render('./users/register')
})*/

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
});


app.listen(process.env.PORT, (err) =>{
    if (err) return console.log(err);

    console.log(`Express listening port ${process.env.PORT}`)
});
