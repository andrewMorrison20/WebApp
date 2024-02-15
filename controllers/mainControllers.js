const conn = require('./../utils/dbconn');
const moment = require('moment');


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

    const selectSQL = `SELECT * FROM snapshot WHERE snapshot.user_id = '${userid}' ORDER BY time_stamp DESC`;
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
        const selectSchemaSQL = `SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS
                                    WHERE table_schema = 'moodify' AND table_name = 'snapshot'`;
        conn.query(selectSchemaSQL, (err, rows) => {
            if (err) throw err;
            else {
                const selectTriggersSQL = 'SELECT * FROM context_trigger';
                conn.query(selectTriggersSQL, (err, rows1) => {
                    if (err) {
                        throw err;
                    } else {
                        console.log(rows)
                        res.render('./dailylog/new', { triggers: rows1, rows: rows, loggedin: isloggedin });
                    }
                });
            }
        });
    } else {
        res.redirect('/');
    }
};



        exports.getEditLog = (req, res) => {
            console.log(req.session)
            console.log(req.body)
            const snapshotid = req.params.id;
            const { isloggedin } = req.session;
            console.log(`User logged in: ${isloggedin}`);


            if (isloggedin) {

                const selectSQL = `SELECT context_trigger.trigger_id,trigger_name FROM snapshot_context_trigger LEFT JOIN context_trigger ON snapshot_context_trigger.trigger_id =
        context_trigger.trigger_id WHERE snapshot_id = ${snapshotid}`;
                conn.query(selectSQL, (err, rows1) => {
                    if (err) throw err;
                    else {
                        const selectSQL = 'SELECT * FROM context_trigger';
                        conn.query(selectSQL, (err, rows2) => {
                            if (err) throw err;
                            else {
                                console.log(rows2)
                                res.render('./dailylog/edit', { currTriggers: rows1, triggers: rows2, loggedin: isloggedin, snapshot_id: snapshotid });
                            };
                        });
                    };
                });
            }
            else {
                res.redirect('/');
            }
        };

        exports.selectLog = (req, res) => {

            console.log(req.session)
            console.log(req.body)
            const snapshotid = req.params.id;
            const { isloggedin } = req.session;
            console.log(`User logged in: ${isloggedin}`);


            if (isloggedin) {

                const selectSnapSQL = `SELECT * FROM snapshot where snapshot_id = ${snapshotid}`;
                conn.query(selectSnapSQL, (err, rows1) => {
                    if (err) throw err;
                    else {
                        const selectTriggersSQL = `SELECT context_trigger.trigger_id,trigger_name FROM snapshot_context_trigger LEFT JOIN context_trigger ON snapshot_context_trigger.trigger_id =
                context_trigger.trigger_id WHERE snapshot_id = ${snapshotid}`;
                        conn.query(selectTriggersSQL, (err, rows2) => {
                            if (err) throw err;
                            else {
                                console.log(rows2)
                                res.render('./dailylog/view', { emotions: rows1, triggers: rows2, loggedin: isloggedin, snapshotid: snapshotid });
                            };
                        });
                    };
                });
            }
            else {
                res.redirect('/');
            }
        };

/*        exports.postNewLog = (req, res) => {
            const { isloggedin, userid } = req.session;
            console.log(`User logged in: ${isloggedin}`);
            console.log(req.body);
            console.log(userid);
            const { enjoyment, anger, contempt, sadness, disgust, surprise, fear, notes, triggers } = req.body;
            var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
            const vals1 = [null, userid, enjoyment, sadness, anger, contempt, disgust, fear, surprise, mysqlTimestamp, notes];
            const vals2 = triggers;


            const insertSQL = 'INSERT INTO snapshot (snapshot_id,user_id,enjoyment,sadness,anger,contempt,disgust,fear,surprise,time_stamp,notes) VALUES ( ?,?,?,?,?,?,?,?,?,?,?)';

            conn.query(insertSQL, vals1, (err, rows) => {
                if (err) {
                    throw err;
                } else {
                    const snapshotid = rows.insertId;
                    console.log(snapshotid);
                    if (triggers.length > 0) {
                        triggers.forEach(triggerId => {
                            const insertTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id,snapshot_id,trigger_id) VALUES (null,'${snapshotid}',${triggerId})`
                            conn.query(insertTriggersSQL, (err, rows) => {
                                if (err) throw err;
                                else { res.redirect('/') };
                            });
                        });
                    }


                }
            });

        };
    */
        exports.postNewLog = (req, res) => {
            const { isloggedin, userid } = req.session;
            console.log(`User logged in: ${isloggedin}`);
            console.log(req.body);
            console.log(userid);
            const { enjoyment, anger, contempt, sadness, disgust, surprise, fear, notes, triggers } = req.body;
            var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
            const vals1 = [null, userid, enjoyment, sadness, anger, contempt, disgust, fear, surprise, mysqlTimestamp, notes];
        
            const insertSQL = 'INSERT INTO snapshot (snapshot_id,user_id,enjoyment,sadness,anger,contempt,disgust,fear,surprise,time_stamp,notes) VALUES ( ?,?,?,?,?,?,?,?,?,?,?)';
        
            conn.query(insertSQL, vals1, (err, rows) => {
                if (err) {
                    throw err;
                } else {
                    const snapshotid = rows.insertId;
                    console.log(snapshotid);
                    if (triggers.length > 0) {
                        const insertTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id,snapshot_id,trigger_id) VALUES ?`;
                        const triggerValues = triggers.map(triggerId => [null, snapshotid, triggerId]);
                        conn.query(insertTriggersSQL, [triggerValues], (err, rows) => {
                            if (err) throw err;
                            else { 
                                res.redirect('/dailylog/showall');
                            }
                        });
                    } else {
                        res.redirect('/dailylog/showall');
                    }
                }
            });
        };
            
      /*  exports.updateLogTriggers = (req, res) => {

            const snapshot_id = req.params.id;
            const { triggers } = req.body;
            const vals = triggers;

            const deleteTriggersSQL = `DELETE FROM snapshot_context_trigger WHERE snapshot_id = ${snapshot_id}`;
            conn.query(deleteTriggersSQL, vals, (err, rows) => {
                if (err)
                    throw err;
                else {
                    if (triggers.length > 0) {
                        triggers.forEach(triggerId => {
                            const insertNewTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id,snapshot_id,trigger_id) VALUES (null,'${snapshot_id}',${triggerId})`
                            conn.query(insertNewTriggersSQL, (err, rows) => {
                                if (err) throw err;

                            });
                        });
                    };
                };
            });
        };*/

        exports.updateLogTriggers = (req, res) => {
            const snapshot_id = req.params.id;
            const { triggers } = req.body;
        
            const deleteTriggersSQL = `DELETE FROM snapshot_context_trigger WHERE snapshot_id = ${snapshot_id}`;
            conn.query(deleteTriggersSQL, triggers, (err, rows) => {
                if (err) {
                    throw err;
                } else {
                    if (triggers.length > 0) {
                        const insertValues = triggers.map(triggerId => ` (null, '${snapshot_id}', ${triggerId})`).join(',');
                        const insertNewTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id, snapshot_id, trigger_id) VALUES ${insertValues}`;
                        conn.query(insertNewTriggersSQL, (err, rows) => {
                            if (err) {
                                throw err;
                            }
                            // Redirect after successful insertion
                            res.redirect('/dailylog/showall');
                        });
                    } else {
                        // Redirect even if there are no triggers to insert
                        res.redirect('/dailylog/showall');
                    }
                }
            });
        };
        



        exports.deleteLog = (req, res) => {

            const snapshot_id = req.params.id;
            console.log(snapshot_id)

            const deleteSQL1 = `DELETE FROM snapshot_context_trigger WHERE snapshot_id = ${snapshot_id}`;
            conn.query(deleteSQL1, (err, rows) => {
                if (err) throw err;
                else {
                    const deleteSQL2 = `DELETE FROM snapshot WHERE snapshot_id = ${snapshot_id}`;
                    conn.query(deleteSQL2, (err, rows) => {
                        if (err) throw err;
                        else {
                            res.redirect('/dailylog/showall');
                        }
                    });
                };
            });
        };

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
        }
