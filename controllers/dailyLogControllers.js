const conn = require('./../utils/dbconn');
const moment = require('moment');



exports.getLogs = async (req, res) => {

    const { isloggedin, userid } = req.session;

    try {
        // Check if the user is logged in
        if (!isloggedin) {
            return res.redirect('/login');
        }

        // Query to retrieve user information
        const getuserSQL = `SELECT user.user_name, user.first_name FROM user WHERE user.user_id = ?`;

        // Execute user query
        const [userRows, fields] = await conn.query(getuserSQL, userid);
        if (userRows.length === 0) {
            throw new Error('User not found');
        }

        // Populate session variables
        const username = userRows[0].user_name;
        const firstname = userRows[0].first_name;
        req.session.name = username;
        req.session.firstName = firstname;
        const userinfo = { name: username, firstname: firstname };

        // Query to retrieve snapshot data
        const selectSQL = `SELECT * FROM snapshot WHERE snapshot.user_id = ? ORDER BY time_stamp DESC`;

        // Execute snapshot query
        const [snapshotRows] = await conn.query(selectSQL, userid);
        if (snapshotRows.length === 0) {
            req.flash('error', 'Create a daily snapshot first!');
            return res.redirect('/dailylog/new');
        }

        //filter keys to only include the emotions
        const emotions = Object.keys(snapshotRows[0] || {}).filter(key => key !== 'snapshot_id' && key !== 'user_id' && key !== 'time_stamp' && key !== 'notes');

        // Select the top 5 snapshots
        const top5Snaps = snapshotRows.slice(0, 5);
        const emotionDataSets = [];

        // Extract emotion values from top 5 snapshots
        top5Snaps.forEach(snap => {
            const emotionArray = Object.keys(snap)
                .filter(key => !['user_id', 'snapshot_id', 'notes', 'time_stamp'].includes(key))
                .map(key => snap[key]);
            emotionDataSets.push(emotionArray);
        });

        // Extract date labels
        const revrows = [...snapshotRows];
        revrows.reverse();
        const dateLabels = revrows.map(row => {
            const date = new Date(row.time_stamp);
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        });

        const emotionArrays = emotions.map(emotion => revrows.map(row => row[emotion]));

        // Query to retrieve count of triggers
        const selectCountSQL = `SELECT COUNT(*), trigger_name FROM snapshot 
            INNER JOIN snapshot_context_trigger ON snapshot.snapshot_id = snapshot_context_trigger.snapshot_id 
            INNER JOIN context_trigger ON snapshot_context_trigger.trigger_id = context_trigger.trigger_id 
            WHERE user_id = ?
            GROUP BY context_trigger.trigger_id;`;

        // Execute count query
        const [countRows] = await conn.query(selectCountSQL, userid);

        // Extract counts and trigger names
        const counts = countRows.map(item => item['COUNT(*)']);
        const triggerNames = countRows.map(item => item.trigger_name);

        // Render the view with data
        res.render('./dailylog/show', {
            log: snapshotRows,
            counts: counts,
            topDataSets: emotionDataSets,
            triggerNames: triggerNames,
            emotionNames: emotions,
            emotionValues: emotionArrays,
            loggedin: isloggedin,
            user: userinfo,
            dates: dateLabels
        });
    } catch (error) {
        console.error('An error occurred while retrieving logs:', error);
        req.flash('error', 'An error occurred while retrieving logs.');
        res.redirect('/login');
    }
};



exports.getAddNewLog = async (req, res) => {
    try {
        const { isloggedin } = req.session;
        console.log(`User logged in: ${isloggedin}`);

        if (!isloggedin) {
            req.flash('error', 'You must log in first');
            return res.redirect('/login');
        }

        const selectSchemaSQL = `SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS
                                    WHERE table_schema = 'moodify' AND table_name = 'snapshot'`;

        const [schemaRows, schemaFields] = await conn.query(selectSchemaSQL);

        const selectTriggersSQL = 'SELECT * FROM context_trigger';
        const [triggersRows, triggersFields] = await conn.query(selectTriggersSQL);

        console.log(schemaRows);

        res.render('./dailylog/new', { triggers: triggersRows, rows: schemaRows, loggedin: isloggedin });
    } catch (error) {
        console.error('An error occurred while retrieving new log:', error);
        res.redirect('/');
    }
};




exports.getEditLog = async (req, res) => {
    try {
        const snapshotid = req.params.id;
        const { isloggedin, userid } = req.session;
        console.log(`User logged in: ${isloggedin}`);
        console.log(`Snapshot ID: ${snapshotid}`);
        console.log(`User ID: ${userid}`);

        if (!isloggedin) {
            req.flash('error', 'Must be logged in to edit entries');
            return res.redirect('/');
        }

        const checkUserId = `SELECT * FROM snapshot WHERE snapshot_id = ?`;
        const [userRows, userFields] = await conn.query(checkUserId, [snapshotid]);

        if (userRows[0].length === 0 || userRows[0].user_id !== userid) {
            req.flash('error', 'You are not permitted to edit this snapshot.');
            return res.redirect('/login');
        }

        const selectSQL = `SELECT context_trigger.trigger_id, trigger_name 
                           FROM snapshot_context_trigger 
                           LEFT JOIN context_trigger 
                           ON snapshot_context_trigger.trigger_id = context_trigger.trigger_id 
                           WHERE snapshot_id = ?`;

        const [rows1, fields1] = await conn.query(selectSQL, [snapshotid]);

        const selectAllTriggersSQL = 'SELECT * FROM context_trigger';
        const [rows2, fields2] = await conn.query(selectAllTriggersSQL);

        console.log(rows2);

        res.render('./dailylog/edit', { currTriggers: rows1, triggers: rows2, loggedin: isloggedin, snapshot_id: snapshotid });
    } catch (error) {
        console.error('An error occurred while retrieving new log:', error);
        res.redirect('/');
    }
};



exports.selectLog = async (req, res) => {
    try {
        const { isloggedin, userid } = req.session;
        console.log(`User logged in: ${isloggedin}`);

        if (!isloggedin) {
            return res.redirect('/');
        }

        const snapshotid = req.params.id;
        const selectSnapSQL = `SELECT * FROM snapshot WHERE snapshot_id = ?`;
        const [rows, fields1] = await conn.query(selectSnapSQL, [snapshotid]);

        if (rows.length === 0 || rows[0].user_id !== userid) {
            req.flash('error', 'You are not permitted to view this snapshot.');
            return res.redirect('/login');
        }

        const selectTriggersSQL = `SELECT context_trigger.trigger_id, trigger_name 
            FROM snapshot_context_trigger 
            LEFT JOIN context_trigger ON snapshot_context_trigger.trigger_id = context_trigger.trigger_id 
            WHERE snapshot_id = ?`
        const [triggers, fields2] = await conn.query(selectTriggersSQL, [snapshotid]);

        console.log(triggers);

        res.render('./dailylog/view', { emotions: rows, triggers: triggers, loggedin: isloggedin, snapshotid: snapshotid });
    } catch (error) {
        console.error('An error occurred while selecting log:', error);
        req.flash('error', 'An error occurred while retrieving the log.');
        res.redirect('/');
    }
};



exports.postNewLog = async (req, res) => {
    try {
        const { isloggedin, userid } = req.session;
        console.log(`User logged in: ${isloggedin}`);
        console.log(req.body);
        console.log(userid);
        const { notes, triggers, ...emotions } = req.body;
        console.log(`emotions are currently : ${emotions}`);
        const mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        // Extract emotion keys and values
        const emotionKeys = Object.keys(emotions);
        const emotionValues = emotionKeys.map(key => emotions[key]);
        console.log(emotionKeys);
        console.log(emotionValues);
        // Prepare SQL query placeholders and values
        const placeholders = Array(emotionKeys.length).fill('?').join(',');

        const insertSQL = `INSERT INTO snapshot (snapshot_id,user_id,${emotionKeys.join(',')},time_stamp,notes) VALUES (NULL,${userid},${placeholders},?,?)`;

        const insertValues = [...emotionValues, mysqlTimestamp, notes];
        console.log(insertValues);
        console.log(insertSQL);

        // Insert new snapshot
        const [insertRows, fields] = await conn.query(insertSQL, insertValues);
        const snapshotId = insertRows.insertId;
        console.log(snapshotId);

        // Insert triggers if any
        if (triggers && triggers.length > 0) {
            const insertTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id,snapshot_id,trigger_id) VALUES ?`;
            const triggerValues = triggers.map(triggerId => [null, snapshotId, triggerId]);
            await conn.query(insertTriggersSQL, [triggerValues]);
        }

        // Redirect to show all logs
        req.flash('success', triggers && triggers.length > 0 ? 'Successfully added Entry & triggers' : 'Successfully added Entry');
        res.redirect('/dailylog/showall');
    } catch (error) {
        console.error('An error occurred while adding new log:', error);
        req.flash('error', 'An error occurred while adding new log.');
        res.redirect('/dailylog/new');
    }
};



exports.updateLogTriggers = async (req, res) => {
    try {
        const snapshot_id = req.params.id;
        const { triggers, notes } = req.body;

        // Delete existing triggers
        const deleteTriggersSQL = `DELETE FROM snapshot_context_trigger WHERE snapshot_id = ?`;
        await conn.query(deleteTriggersSQL, [snapshot_id]);

        // Insert new triggers if any (force triggers to be an array to cover single trigger for map func )
        if (triggers && triggers.length > 0) {
            const insertValues = [...triggers].map(triggerId => [null, snapshot_id, triggerId]);
            const insertNewTriggersSQL = `INSERT INTO snapshot_context_trigger (snapshot_context_trigger_id, snapshot_id, trigger_id) VALUES ?`;
            await conn.query(insertNewTriggersSQL, [insertValues]);
        } else {
            req.flash('success', 'Previous triggers successfully deleted');
        }

        // Update notes if provided
        if (notes && notes.length > 0) {
            const updateNotesSQL = `UPDATE snapshot SET notes = ? WHERE snapshot_id = ?`;
            await conn.query(updateNotesSQL, [notes, snapshot_id]);
            req.flash('success', 'Entry successfully updated with notes');
        } else {
            req.flash('success', 'Entry successfully updated');
        }

        res.redirect('/dailylog/showall');
    } catch (error) {

        req.flash('error', 'An error occurred while updating log triggers.');
        res.redirect('/dailylog/showall');
    }
};


exports.deleteLog = async (req, res) => {
    try {
        const { isloggedin } = req.session;
        const snapshot_id = req.params.id;
        console.log(snapshot_id);

        const deleteSQL1 = `DELETE FROM snapshot_context_trigger WHERE snapshot_id = ?`;
        await conn.query(deleteSQL1, [snapshot_id]);

        const deleteSQL2 = `DELETE FROM snapshot WHERE snapshot_id = ?`;
        await conn.query(deleteSQL2, [snapshot_id]);

        req.flash('success', 'Entry Deleted');
        res.redirect('/dailylog/showall');
    } catch (error) {
        console.error('Error deleting entry:', error);
        req.flash('error', 'An error occurred while deleting the entry.');
        res.redirect('/dailylog/showall');
    }
};

exports.getHome = (req, res) => {

    var userinfo = {};
    const { isloggedin, userid } = req.session;
    console.log(`User data from session: ${isloggedin}, ${userid}`)
    res.render('home', { loggedin: isloggedin, user: userinfo });
};




