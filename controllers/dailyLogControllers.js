const conn = require('./../utils/dbconn');
const moment = require('moment');


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
            console.log(rows);
            if (rows.length === 0) { 
                
                req.flash('error, create a daily snaphot first!');
                res.redirect('/dailylog/new') };
            //filter keys to only include the emotions
            //const emotions = Object.keys(rows[0]).filter(key => key !== 'snapshot_id' && key !== 'user_id' && key !== 'time_stamp' && key !== 'notes');
            //create an array for each set of values for each emotion
            const emotions = Object.keys(rows[0] || {}).filter(key => key !== 'snapshot_id' && key !== 'user_id' && key !== 'time_stamp' && key !== 'notes');
            console.log(emotions);


            // Select the top 5 snapshots
            const top5Snaps = rows.slice(0, 5);
            const emotionDataSets = [];

            // Extract emotion values from top 5 snapshots
            top5Snaps.forEach(snap => {
                const emotionArray = Object.keys(snap)
                    .filter(key => !['user_id', 'snapshot_id', 'notes', 'time_stamp'].includes(key))
                    .map(key => snap[key]);
                emotionDataSets.push(emotionArray);
            });

            // Extract date labels
            const revrows = [...rows];
            revrows.reverse();
            const dateLabels = revrows.map(row => {
                const date = new Date(row.time_stamp);
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            });
            const emotionArrays = emotions.map(emotion => revrows.map(row => row[emotion]));
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
                    emotionNames: emotions,
                    emotionValues: emotionArrays,
                    loggedin: isloggedin,
                    user: userinfo,
                    dates: dateLabels
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



/*exports.getEditLog = (req, res) => {
    //console.log(req.session)
    //console.log(req.body)
    const snapshotid = req.params.id;
    const { isloggedin, userid } = req.session;
    console.log(`User logged in: ${isloggedin}`);
    console.log(`snapshotid : ${req.params.id}`);
    console.log(`userid : ${userid}`);

    if (isloggedin) {

        const checkUserId = `SELECT * FROM snapshot where snapshot_id = ${snapshotid}`;

        conn.query(checkUserId, (err, rows) => {
            if (err) throw err;
            console.log(rows);
            const loguser = rows[0].user_id;
            console.log(`results : ${rows}`);
            console.log(`logged user : ${loguser}`);
            if (rows.length > 0 && rows[0].user_id === userid) {
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
                    }


                });
            }

            else { res.redirect('/login') };
        });
    }
    else {
        res.redirect('/');
    }
};
*/
exports.getEditLog = (req, res) => {
    const snapshotid = req.params.id;
    const { isloggedin, userid } = req.session;
    console.log(`User logged in: ${isloggedin}`);
    console.log(`Snapshot ID: ${snapshotid}`);
    console.log(`User ID: ${userid}`);

    if (!isloggedin) {
        return res.redirect('/');
    }

    const checkUserId = `SELECT * FROM snapshot WHERE snapshot_id = ${snapshotid}`;

    conn.query(checkUserId, (err, rows) => {
        if (err) {
            throw err;
        }

        console.log(rows);
        if (rows.length === 0 || rows[0].user_id !== userid) {
            req.flash('error', 'You are not permitted to edit this snapshot.');
            return res.redirect('/login');
        }

        const selectSQL = `SELECT context_trigger.trigger_id, trigger_name 
                           FROM snapshot_context_trigger 
                           LEFT JOIN context_trigger 
                           ON snapshot_context_trigger.trigger_id = context_trigger.trigger_id 
                           WHERE snapshot_id = ${snapshotid}`;

        conn.query(selectSQL, (err, rows1) => {
            if (err) {
                throw err;
            }

            const selectAllTriggersSQL = 'SELECT * FROM context_trigger';

            conn.query(selectAllTriggersSQL, (err, rows2) => {
                if (err) {
                    throw err;
                }

                console.log(rows2);
                res.render('./dailylog/edit', { currTriggers: rows1, triggers: rows2, loggedin: isloggedin, snapshot_id: snapshotid });
            });
        });
    });
};


/*exports.getEditLog = (req, res) => {
    const snapshotid = req.params.id;
    const { isloggedin, userid } = req.session; 
    console.log(`User logged in: ${isloggedin}`);
    console.log(req.session.userid);

    // Check if the user is logged in
    if (isloggedin) {
        // Query to retrieve the snapshot data for the specified snapshotid
        const selectSQL = `SELECT user_id FROM snapshot WHERE snapshot_id = ${snapshotid}`;
    
        conn.query(selectSQL, (err, rows) => {
            if (err) {
                throw err;
            } else {
                console.log(rows);
                console.log(rows[0].user_id);
                if (rows.length > 0 && rows[0].user_id === userid) { 
                    // Check if the snapshot belongs to the logged-in user
                    const selectTriggerSQL = `SELECT context_trigger.trigger_id,trigger_name FROM snapshot_context_trigger LEFT JOIN context_trigger ON snapshot_context_trigger.trigger_id = context_trigger.trigger_id WHERE snapshot_id = ${snapshotid}`;
                    conn.query(selectTriggerSQL, (err, triggerRows) => {
                        if (err) {
                            throw err;
                        } else {
                            const selectAllTriggersSQL = 'SELECT * FROM context_trigger';
                            conn.query(selectAllTriggersSQL, (err, allTriggersRows) => {
                                if (err) {
                                    throw err;
                                } else {
                                    console.log(allTriggersRows);
                                    res.render('./dailylog/edit', { currTriggers: triggerRows, triggers: allTriggersRows, loggedin: isloggedin, snapshot_id: snapshotid });
                                }
                            });
                        }
                    });
                } else {
                    res.redirect('/login'); // Redirect if the snapshot doesn't belong to the logged-in user
                }
            }
        });
    } else {
        res.redirect('/'); // Redirect if the user is not logged in
    }
};*/

/* exports.selectLog = (req, res) => {

    console.log(req.session)
    console.log(req.body)
    const snapshotid = req.params.id;
    const { isloggedin } = req.session;
    console.log(`User logged in: ${isloggedin}`);


    if (isloggedin) {
        const checkUserId = `SELECT * FROM snapshot WHERE snapshot_id = ${snapshotid}`;

        conn.query(checkUserId, (err, rows) => {
            if (err) {
                throw err;
            }
    
            console.log(rows);
            if (rows.length === 0 || rows[0].user_id !== userid) {
                req.flash('error', 'You are not permitted to edit this snapshot.');
                return res.redirect('/login');
            }

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
   )};
 }
    else {
        res.redirect('/');
    }
};*/
exports.selectLog = (req, res) => {
    console.log(req.session);
    console.log(req.body);
    const snapshotid = req.params.id;
    const { isloggedin, userid } = req.session;
    console.log(`User logged in: ${isloggedin}`);

    if (isloggedin) {
        const checkUserId = `SELECT * FROM snapshot WHERE snapshot_id = ${snapshotid}`;

        conn.query(checkUserId, (err, rows) => {
            if (err) {
                throw err;
            }

            console.log(rows);
            if (rows.length === 0 || rows[0].user_id !== userid) {
                req.flash('error', 'You are not permitted to view this snapshot.');
                return res.redirect('/login');
            }

            const selectSnapSQL = `SELECT * FROM snapshot WHERE snapshot_id = ${snapshotid}`;
            conn.query(selectSnapSQL, (err, rows1) => {
                if (err) {
                    throw err;
                } else {
                    const selectTriggersSQL = `SELECT context_trigger.trigger_id, trigger_name 
                                                FROM snapshot_context_trigger 
                                                LEFT JOIN context_trigger 
                                                ON snapshot_context_trigger.trigger_id = context_trigger.trigger_id 
                                                WHERE snapshot_id = ${snapshotid}`;
                    conn.query(selectTriggersSQL, (err, rows2) => {
                        if (err) {
                            throw err;
                        } else {
                            console.log(rows2);
                            res.render('./dailylog/view', { emotions: rows1, triggers: rows2, loggedin: isloggedin, snapshotid: snapshotid });
                        }
                    });
                }
            });
        });
    } else {
        res.redirect('/');
    }
};


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
            if (triggers && triggers.length > 0) {
                const insertTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id,snapshot_id,trigger_id) VALUES ?`;
                const triggerValues = triggers.map(triggerId => [null, snapshotid, triggerId]);
                conn.query(insertTriggersSQL, [triggerValues], (err, rows) => {
                    if (err) throw err;
                    else {
                        req.flash('success', 'Successfully added Entry & triggers');
                        res.redirect('/dailylog/showall');
                    }
                });
            } else {
                req.flash('success', 'Successfully added Entry')
                res.redirect('/dailylog/showall');
            }
        }
    });
};



/*exports.updateLogTriggers = (req, res) => {
    const snapshot_id = req.params.id;
    const { triggers, notes } = req.body;
    const { isloggedin } = req.session;

    const deleteTriggersSQL = `DELETE FROM snapshot_context_trigger WHERE snapshot_id = ${snapshot_id}`;
    conn.query(deleteTriggersSQL, triggers, (err, rows) => {
        if (err) {
            throw err;
        } else {
            if (triggers && triggers.length > 0) {
                const insertValues = triggers.map(triggerId => ` (null, '${snapshot_id}', ${triggerId})`).join(',');
                const insertNewTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id, snapshot_id, trigger_id) VALUES ${insertValues}`;
                conn.query(insertNewTriggersSQL, (err, rows) => {
                    if (err) {
                        throw err;
                    }

                    if (notes && notes.trim().length > 0) {
                        const updateNotesSQL = `UPDATE snapshot SET notes = '${notes}' WHERE snapshot_id = ${snapshot_id}`;
                        conn.query(updateNotesSQL, (err, rows) => {
                            if (err) {
                                throw err;
                            }
                            // Redirect after successful insertion
                            req.flash('success', 'Entry successfully updated with notes');
                            res.redirect('/dailylog/showall');
                        });
                     // Redirect after successful insertion
                     req.flash('success', 'Entry successfully updated with notes');
                     res.redirect('/dailylog/showall');
                });
            } else {
                // Redirect even if there are no triggers to insert
                req.flash('success', 'Triggers succesfully removed');
                res.redirect('/dailylog/showall');
            }
        }
    });
};

*/
exports.updateLogTriggers = (req, res) => {
    const snapshot_id = req.params.id;
    const { triggers, notes } = req.body;

    const deleteTriggersSQL = `DELETE FROM snapshot_context_trigger WHERE snapshot_id = ${snapshot_id}`;
    conn.query(deleteTriggersSQL, triggers, (err, rows) => {
        if (err) {
            throw err;
        } else {
            if (triggers && triggers.length > 0) {
                const insertValues = triggers.map(triggerId => ` (null, '${snapshot_id}', ${triggerId})`).join(',');
                const insertNewTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id, snapshot_id, trigger_id) VALUES ${insertValues}`;
                conn.query(insertNewTriggersSQL, (err, rows) => {
                    if (err) {
                        throw err;
                    }

                    if (notes && notes.length > 0) {
                        const updateNotesSQL = `UPDATE snapshot SET notes = '${notes}' WHERE snapshot_id = ${snapshot_id}`;
                        conn.query(updateNotesSQL, (err, rows) => {
                            if (err) {
                                throw err;
                            }
                            // Redirect after successful insertion of notes
                            req.flash('success', 'Entry successfully updated with notes');
                            res.redirect('/dailylog/showall');
                        });
                    } else {
                        // Redirect after successful insertion of triggers
                        req.flash('success', 'Entry successfully updated without notes');
                        res.redirect('/dailylog/showall');
                    }
                });
            } else {
                // Redirect even if there are no triggers to insert
                req.flash('success', 'Triggers successfully removed');
                res.redirect('/dailylog/showall');
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
                    req.flash('success', 'Entry Deleted')
                    res.redirect('/dailylog/showall');
                }
            });
        };
    });
};



exports.getHome = (req, res) => {

    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}, ${userid}`)
    res.render('home', { loggedin: isloggedin, user: userinfo });
};




