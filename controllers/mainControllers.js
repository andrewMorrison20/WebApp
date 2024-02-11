const conn = require('./../utils/dbconn');

/*exports.getLogs = (req, res) => {

    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}, ${userid}`);

    if (isloggedin) {

        const getuserSQL = `SELECT user.user_name, snapshot.time_stamp,snapshot.enjoyment,
                            snapshot.sadness,snapshot.anger,snapshot.contempt,snapshot.disgust,
                            snapshot.fear,snapshot.surprise,notes 
                            FROM user LEFT JOIN snapshot ON
                            user.user_id = snapshot.user_id
                            WHERE user.user_id = '${userid}'`;

        conn.query(getuserSQL, (err, rows) => {
            if (err) throw err;

            console.log(rows);
            const username = rows[0].name;
            

            const session = req.session;
            session.name = username;
            console.log(session);
            userinfo = { name: username};
            console.log(userinfo);
        });
    }
*/

exports.getLogs = (req, res) => {

    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}, ${userid}`);

    if (isloggedin) {

        const getuserSQL = `SELECT user.user_name FROM user
                            WHERE user.user_id = '${userid}'`;

        conn.query(getuserSQL, (err, rows) => {
            if (err) throw err;

            console.log(rows);
            const username = rows[0].user_name;


            const session = req.session;
            session.name = username;
            console.log(session);

            userinfo = { name: username };
            console.log(userinfo);
        });
    }

    const selectSQL = `SELECT * FROM snapshot WHERE snapshot.user_id = '${userid}'`;
    conn.query(selectSQL, (err, rows) => {
        if (err) {
            throw err;
        } else {
            console.log(rows)
            res.render('./dailylog/show', { log: rows, loggedin: isloggedin, user: userinfo });
        }
    });
};


exports.getAddNewLog = (req, res) => {


    const { isloggedin } = req.session;
    console.log(`User logged in: ${isloggedin}`);

    if (isloggedin) {
        res.render('./dailylog/new');
    } else {
        res.redirect('/');
    }
};

exports.selectLog = (req, res) => {

    const { isloggedin, role } = req.session;
    console.log(`User logged in: ${isloggedin}`);
    console.log(`User role: ${role}`);

    if (isloggedin) {

        const { id } = req.params;

        const selectSQL = `SELECT * FROM snapshot WHERE id = ${id}`;
        conn.query(selectSQL, (err, rows) => {
            if (err) {
                throw err;
            } else {
                console.log(rows);
                res.render('dailylog/edit', { details: rows, role });
            }
        });
    } else {
        res.redirect('/');
    }
};

exports.postNewLog = (req, res) => {
    const { isloggedin } = req.session;
    console.log(`User logged in: ${isloggedin}`);
    console.log(req.body);
    res.redirect('/dailylog/show');
    
    /*const { ,  } = req.body;
    const vals = [  ];

    const insertSQL = 'INSERT INTO snapshot (snapshot_id,user_id,enjoyment,sadness,anger,contempt,disgust,fear,surprise,time_stamp,notes) VALUES ( ?)';

    conn.query(insertSQL, vals, (err, rows) => {
        if (err) {
            throw err;
        } else {
            res.redirect('/dailylog/show');
        }
    });*/
}

exports.updateLogTriggers = (req, res) => {

    const run_id = req.params.id;
    const { run_details, run_date } = req.body;
    const vals = [run_details, run_date, run_id];

    const updateSQL = 'UPDATE runschedule SET items = ?, mydate = ? WHERE id = ?';
    conn.query(updateSQL, vals, (err, rows) => {
        if (err) {
            throw err;
        } else {
            res.redirect('/');
        }
    });
};

/*
exports.deleteLog = (req, res) => {
    
    const run_id = req.params.id;

    const deleteSQL1 = `DELETE FROM snapshot WHERE snapshot_id = ${snapshot_id}`;
    conn.query(deleteSQL1, (err, rows) => {
        if (err) {  
            
        const deleteSQL2 = `DELETE FROM snapshot_context_trigger WHERE snapshot_id = ${snapshot_id}`;
        conn.query(deleteSQL2, (err, rows) => {
            if (err) {
                throw err;
            } else {
                res.redirect('/');
            }
        
       

    
    });
};
*/

exports.getLogin = (req, res) => {
    res.render('./users/login');
};

exports.getHome = (req, res) => {

    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}, ${userid}`)
    res.render('home', { loggedin: isloggedin, user: userinfo });
};

exports.getRegister = (req, res) => {
    res.render('./users/register');
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

            res.redirect('/');
        } else {
            res.redirect('/');
        }
    });
};

exports.postRegister = (req, res) => {
    try {
        const { username, email, password, firstname, lastname } = req.body;
        const vals = [username, email, password, firstname, lastname];
        console.log(vals);
        const insertUserSQL = 'INSERT INTO `user` (`user_id`, `user_name`, `email`, `password`, `first_name`, `last_name`) VALUES  (NULL, ?, ?, ?, ?,?)';
        conn.query(insertUserSQL, vals, (err, rows) => {
            if (err) {
                throw err;
            }
            else {
                res.redirect('/');
            }
        });
     } catch (e) {
        /*req.flash('error', e.message);
        res.redirect('register');*/
    }
};

exports.getLogout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
