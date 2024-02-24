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

/*exports.postLogin = (req, res) => {
    const { isloggedin } = req.session
    const { username, password } = req.body;
    const vals = [username, password];
    console.log(vals);

    const checkuserSQL = `SELECT user_id FROM user WHERE user.user_name = '${username}' 
                            AND user.password = '${password}'`;
    
    conn.query(checkuserSQL, vals, (err, rows) => {
        if (err) throw err;

        const numrows = rows.length;
        console.log(numrows);

        if (numrows > 0) {
            console.log(rows);
            const session = req.session;
            session.isloggedin = true;
            console.log(rows[0]);
            session.userid = rows[0].user_id;
            console.log(session);
            console.log(session.isloggedin);
            req.flash('success', 'Login successful, welcome back!');
            res.redirect('/dailylog/showall');
        } else {
            req.flash('error', 'incorrect details!')
            res.redirect('/login');
        }
    });
};*/



exports.postLogin = (req, res) => {
    const { username, password } = req.body;

    // Query the database for the user's hashed password based on the provided username
    const getUserSQL = `SELECT user_id, password FROM user WHERE user_name = ?`;
    conn.query(getUserSQL, username, (err, rows) => {
        if (err) {
            req.flash('error', 'An error occurred during login.');
            return res.redirect('/login');
        }

        // If no user found with the provided username
        if (rows.length === 0) {
            req.flash('error', 'Incorrect username or password.');
            return res.redirect('/login');
        }

        const user = rows[0];
        const hashedPasswordFromDB = user.password;

        // Compare the hashed password from the database with the provided password
        bcrypt.compare(password, hashedPasswordFromDB, (compareErr, result) => {
            if (compareErr) {
                req.flash('error', 'An error occurred during login.');
                return res.redirect('/login');
            }

            if (result) {
                // Passwords match, set session variables and redirect to dashboard
                req.session.isloggedin = true;
                req.session.userid = user.user_id;
                req.flash('success', 'Login successful, welcome back!');
                res.redirect('/dailylog/showall');
            } else {
                // Passwords don't match
                req.flash('error', 'Incorrect username or password.');
                res.redirect('/login');
            }
        });
    });
};



/*exports.postRegister = (req, res) => {
    try {
        const { username, email, password, firstname, lastname } = req.body;
        const vals = [username, email, password, firstname, lastname];
        
        const checkUserSQL = `SELECT user_name, first_name FROM user WHERE email = ?`;

        // Check if the user already exists
        conn.query(checkUserSQL, email, (err, rows) => {
            if (err) {
                throw err;
            } else {
                if (rows && rows.length > 0) {
                    req.flash('error', "User already registered!");
                    return res.redirect('/register');
                }

                // If the user does not exist, insert the new user
                const insertUserSQL = 'INSERT INTO `user` (`user_id`, `user_name`, `email`, `password`, `first_name`, `last_name`) VALUES  (NULL, ?, ?, ?, ?, ?)';
                conn.query(insertUserSQL, vals, (err, rows) => {
                    if (err) {
                        throw err;
                    } else {
                        req.flash('success','user succesfully registerd');
                        res.redirect('/');
                    }
                });
            }
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
};
*/



exports.postRegister = (req, res) => {
    const { username, email, password, firstname, lastname } = req.body;

    const checkUserSQL = `SELECT user_name, first_name FROM user WHERE email = ?`;

    // Check if the user already exists
    conn.query(checkUserSQL, email, (err, rows) => {
        if (err) {
            req.flash('error', "An error occurred while registering the user.");
            return res.redirect('/register');
        } 
        
        if (rows && rows.length > 0) {
            req.flash('error', "User already registered!");
            return res.redirect('/register');
        }
        // Hash the password
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                req.flash('error', "An error occurred while registering the user.");
                return res.redirect('/register');
            }
            console.log(hashedPassword);
            // Insert the new user with hashed password
            const insertUserSQL = 'INSERT INTO `user` (`user_id`, `user_name`, `email`, `password`, `first_name`, `last_name`) VALUES  (NULL, ?, ?, ?, ?, ?)';
            const vals = [username, email, hashedPassword, firstname, lastname];
            conn.query(insertUserSQL, vals, (insertErr, rows) => {
                if (insertErr) {
                    req.flash('error', "An error occurred while registering the user.");
                    return res.redirect('/register');
                } else {
                    req.flash('success', 'User successfully registered');
                    res.redirect('/');
                }
            });
        });
    });
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
