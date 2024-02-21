const conn = require('./../utils/dbconn');
const moment = require('moment');


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

exports.postLogin = (req, res) => {
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
};


exports.postRegister = (req, res) => {
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

exports.getLogout = (req, res) => {
    req.flash('success', "Goodbye!");
    req.session.destroy(() => {
        res.redirect('/login');
    });
}
