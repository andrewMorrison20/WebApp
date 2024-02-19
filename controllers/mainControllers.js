const conn = require('./../utils/dbconn');
const moment = require('moment');

exports.showchart = (req, res) => {
    const { isloggedin } = req.session;
    console.log(isloggedin)
    res.render('./dailylog/chart', { loggedin: isloggedin });
}
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

/*exports.getLogs = (req, res) => {

    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}, ${userid}`);

    if (isloggedin) {

        const getuserSQL = `SELECT user.user_name,user.first_name FROM user
                            WHERE user.user_id = '${userid}'`;

        conn.query(getuserSQL, (err, rows) => {
            if (err) throw err;

            console.log(rows);
            const username = rows[0].user_name;
            const firstname= rows.first_name;


            const session = req.session;
            session.name = username;

            session.firstName= firstname;
            console.log(session);

            userinfo = { name: username, firstname:firstname};
            console.log(userinfo);
        });
    }

    const selectSQL = `SELECT * FROM snapshot WHERE snapshot.user_id = '${userid}' ORDER BY time_stamp DESC`;
    conn.query(selectSQL, (err, rows) => {
        if (err) {
            throw err;
        } else {
            const top7Snaps = rows.slice(-5);
            console.log(top7Snaps);
            const emotionDataSets = [];

            top7Snaps.forEach(snap=> {
                const emotionArray = Object.keys(snap)
                    .filter(key => !['user_id', 'snapshot_id', 'notes', 'time_stamp'].includes(key))
                    .map(key => snap[key])
                emotionDataSets.push(emotionArray);
            });

            console.log(emotionDataSets);

            const dateLabels= rows.map(row => {
                const date = new Date(row.time_stamp);
                return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            });
            const selectCountSQL = `SELECT COUNT(*), trigger_name  FROM snapshot 
            INNER JOIN snapshot_context_trigger ON snapshot.snapshot_id = snapshot_context_trigger.snapshot_id 
            INNER JOIN context_trigger ON snapshot_context_trigger.trigger_id = context_trigger.trigger_id 
            WHERE user_id = ${userid}
            GROUP BY context_trigger.trigger_id;`
            conn.query(selectCountSQL, (err, rows1) => {
                if (err) throw err;
                else {
                    console.log(rows1);
                    var counts = rows1.map(item => item['COUNT(*)']);
                    var triggerNames = rows1.map(item => item.trigger_name);

                    console.log("Counts:", counts);
                    console.log("Trigger Names:", triggerNames);
                    res.render('./dailylog/show', { log: rows, counts: counts, topDataSets: emotionDataSets, triggerNames: triggerNames, loggedin: isloggedin, user: userinfo });
                }
            });
            console.log(rows)
        }
    });
};

*/
exports.getLogs = (req, res) => {
    const { isloggedin, userid } = req.session;

    // Check if the user is logged in
    if (!isloggedin) {
        return res.redirect('/login');
    }

    // Initialize userinfo object
    var userinfo = {};

    // Query to retrieve user information
    const getuserSQL = `SELECT user.user_name, user.first_name FROM user
                        WHERE user.user_id = '${userid}'`;

    // Execute user query
    conn.query(getuserSQL, (err, rows) => {
        if (err) {
            throw err;
        }

        // Populate session variables
        const username = rows[0].user_name;
        const firstname = rows[0].first_name;
        req.session.name = username;
        req.session.firstName = firstname;
        userinfo = { name: username, firstname: firstname };
    });

    // Query to retrieve snapshot data
    const selectSQL = `SELECT * FROM snapshot WHERE snapshot.user_id = '${userid}' ORDER BY time_stamp DESC`;
    conn.query(selectSQL, (err, rows) => {
        if (err) {
            throw err;
        } else {
            // Select the top 7 snapshots
            const top7Snaps = rows.slice(0,5);
            const emotionDataSets = [];

            // Extract emotion values from top 7 snapshots
            top7Snaps.forEach(snap => {
                const emotionArray = Object.keys(snap)
                    .filter(key => !['user_id', 'snapshot_id', 'notes', 'time_stamp'].includes(key))
                    .map(key => snap[key]);
                emotionDataSets.push(emotionArray);
            });

            // Extract date labels
            const dateLabels = rows.map(row => {
                const date = new Date(row.time_stamp);
                return `${date.getDate()}/${date.getMonth()+ 1}/${date.getFullYear()}`;
            });

            console.log(dateLabels);

            // Query to retrieve count of triggers
            const selectCountSQL = `SELECT COUNT(*), trigger_name  FROM snapshot 
                INNER JOIN snapshot_context_trigger ON snapshot.snapshot_id = snapshot_context_trigger.snapshot_id 
                INNER JOIN context_trigger ON snapshot_context_trigger.trigger_id = context_trigger.trigger_id 
                WHERE user_id = ${userid}
                GROUP BY context_trigger.trigger_id;`;

            // Execute count query
            conn.query(selectCountSQL, (err, rows1) => {
                if (err) {
                    throw err;
                }

                // Extract counts and trigger names
                const counts = rows1.map(item => item['COUNT(*)']);
                const triggerNames = rows1.map(item => item.trigger_name);

                // Render the view with data
                res.render('./dailylog/show', {
                    log: rows,
                    counts: counts,
                    topDataSets: emotionDataSets,
                    triggerNames: triggerNames,
                    loggedin: isloggedin,
                    user: userinfo,
                    dates:dateLabels
                });
            });
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
                        res.redirect('/dailylog/showall', { loggedin: isloggedin });
                    }
                });
            } else {
                res.redirect('/dailylog/showall', { loggedin: isloggedin });
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
    const { isloggedin } = req.session;

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
                    res.redirect('/dailylog/showall', { loggedin: isloggedin });
                });
            } else {
                // Redirect even if there are no triggers to insert
                res.redirect('/dailylog/showall', { loggedin: isloggedin });
            }
        }
    });
};




exports.deleteLog = (req, res) => {

    const { isloggedin } = req.session
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
                    res.redirect('/dailylog/showall', { loggedin: isloggedin });
                }
            });
        };
    });
};

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
