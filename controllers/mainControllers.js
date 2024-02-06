const conn = require('./../utils/dbconn');

/*exports.getUser = (req, res) => {

    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}, ${userid}`);

    if (isloggedin) {

        const getuserSQL = ``;

        conn.query(getuserSQL, (err, rows) => {
            if (err) throw err;

            console.log(rows);
            const username = rows[0].name;
            const userrole = rows[0].role;

            const session = req.session;
            session.name = username;
            session.role = userrole;
            console.log(session);

            userinfo = { name: username, role: userrole };
            console.log(userinfo);
        });
    

    const selectSQL = 'SELECT * FROM snapshot';
    conn.query(selectSQL, (err, rows) => {   
        if (err) {
            throw err;
        } else {
            res.render('index', { schedule: rows, loggedin: isloggedin, user: userinfo });
        }
    });
};
*/

exports.getAddNewLog= (req, res) => {
    

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

/*exports.postNewRun = (req, res) => {
    const { new_details, new_date } = req.body;
    const vals = [ new_details, new_date ];

    const insertSQL = 'INSERT INTO snapshot (items, mydate) VALUES (?, ?)';

    conn.query(insertSQL, vals, (err, rows) => {
        if (err) {
            throw err;
        } else {
            res.redirect('/');
        }
    });
};

exports.updateLogTriggers = (req, res) => {
    
    const run_id = req.params.id;
    const { run_details, run_date } = req.body;
    const vals = [ run_details, run_date, run_id ];

    const updateSQL = 'UPDATE runschedule SET items = ?, mydate = ? WHERE id = ?';
    conn.query(updateSQL, vals, (err, rows) => {
        if (err) {
            throw err;
        } else {
            res.redirect('/');
        }
    });
};


exports.deleteLog = (req, res) => {
    
    const run_id = req.params.id;

    const deleteSQL = `DELETE FROM runschedule WHERE id = ${run_id}`;
    conn.query(deleteSQL, (err, rows) => {
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
    res.render('home');
};

exports.getRegister = (req, res) => {
    res.render('./users/register');
};

exports.postLogin = (req, res) => {

    const { username, password } = req.body;
    const vals = [ username, password ];
    console.log(vals);

    const checkuserSQL = `SELECT user_id FROM user WHERE user.user_name = '${ username }' 
                            AND user.password = '${ password }'`;

    conn.query( checkuserSQL, vals, (err, rows) => {
        if (err) throw err;

        const numrows = rows.length;
        console.log(numrows);

        if (numrows > 0) {
            console.log(rows);
            const session = req.session;
            session.isloggedin = true;
            session.userid = rows[0].id;
            console.log(session);
            console.log(session.isloggedin);

            res.redirect('/');
        } else {
            res.redirect('/');
        }
    });
};


exports.getLogout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
 
