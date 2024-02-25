const conn = require('./../utils/dbconn');
const moment = require('moment');
const bcrypt = require('bcrypt');

exports.getLogin = (req, res) => {
    const { isloggedin } = req.session;
    console.log(isloggedin)
    res.render('./users/login', { loggedin: isloggedin });
};

exports.getHome = (req, res) => {

    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}, ${userid}`)
    res.render('home', { loggedin: isloggedin, user: userinfo });
};

exports.getRegister = (req, res) => {
    const { isloggedin } = req.session
    res.render('./users/register', { loggedin: isloggedin });
};



exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    console.log(username);
    try {
        // Query the database for the user's hashed password based on the provided username
        const getUserSQL = `SELECT user_id, password FROM user WHERE user_name = ?`;
        const [userdetails, meta] = await conn.query(getUserSQL, username);
        console.log(`query results are : ${userdetails[0]}`);
        // If no user found with the provided username
        if (userdetails[0].length === 0) {
            req.flash('error', 'Incorrect username or password.');
            return res.redirect('/login');
        }
        const hashedPasswordFromDB = userdetails[0].password
        // Compare the hashed password from the database with the provided password
        const result = await bcrypt.compare(password, hashedPasswordFromDB);
        if (result) {
            // Passwords match, set session variables and redirect to dashboard
            req.session.isloggedin = true;
            req.session.userid = userdetails[0].user_id;
            req.flash('success', 'Login successful, welcome back!');
            res.redirect('/dailylog/showall');
        } else {
            // Passwords don't match
            req.flash('error', 'Incorrect username or password.');
            res.redirect('/login');
        }
    } catch (error) {
        req.flash('error', 'An error occurred during login.');
        res.redirect('/login');
    }
};

exports.postRegister = async (req, res) => {
    const { username, email, password, firstname, lastname } = req.body;

    try {
        // Check if the user already exists
        const checkUserSQL = `SELECT user_name, first_name FROM user WHERE email = ?`;
        const [rows, fields] = await conn.query(checkUserSQL, email);

        if (rows && rows.length > 0) {
            req.flash('error', "User already registered!");
            return res.redirect('/register');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        // Insert the new user with hashed password
        const insertUserSQL = 'INSERT INTO `user` (`user_id`, `user_name`, `email`, `password`, `first_name`, `last_name`) VALUES  (NULL, ?, ?, ?, ?, ?)';
        const vals = [username, email, hashedPassword, firstname, lastname];
        await conn.query(insertUserSQL, vals);

        req.flash('success', 'User successfully registered');
        return res.redirect('/');
    } catch (error) {
        console.error('An error occurred while registering the user:', error);
        req.flash('error', 'An error occurred while registering the user.');
        return res.redirect('/register');
    }
};



exports.getLogout = (req, res) => {
    const { isloggedin } = req.session;
    if (isloggedin) {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    } else {
        req.flash('error', "Not logged in");
        res.redirect('/login');
    }
};
