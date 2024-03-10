
const moment = require('moment');
const axios = require('axios');

exports.getLogs = async (req, res) => {
    try {
        const { isloggedin, userid, username, firstname } = req.session;
        const userinfo = { name: username, firstname: firstname };
        // Check if the user is logged in
        if (!isloggedin) {
            req.flash('error', 'You must log in first');
            return res.redirect('/login');
        }

        // Fetch snapshot data from API
        const config = { validateStatus: (status) => { return status < 500 } }
        const snapshotResponse = await axios.get(`http://localhost:3002/dailylog/showall/${userid}`, config);
        const snapshotRows = snapshotResponse.data.snapshots;
        console.log(snapshotRows);

        if (!snapshotRows || snapshotRows.length === 0) {
            req.flash('success', 'Create your first daily snapshot!');
            return res.redirect('/dailylog/new');
        }

        // Extract emotion names and values
        const emotions = Object.keys(snapshotRows[0] || {})
            .filter(key => !['snapshot_id', 'user_id', 'time_stamp', 'notes'].includes(key));

        // Select the top 5 snapshots
        const top5Snaps = snapshotRows.slice(0, 5);
        const emotionDataSets = top5Snaps.map(snap => emotions.map(emotion => snap[emotion]));

        const revrows = [...snapshotRows];
        revrows.reverse();
        const dateLabels = revrows.map(row => {
            const date = new Date(row.time_stamp);
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        });
        const emotionArrays = emotions.map(emotion => revrows.map(row => row[emotion]));
        // Fetch trigger counts from API
        const countResponse = await axios.get(`http://localhost:3002/dailylog/triggerCounts/${userid}`, config);
        const countRows = countResponse.data.triggerCounts;
        console.log(countRows);
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
            loggedin: isloggedin,
            user: userinfo,
            dates: dateLabels,
            emotionValues: emotionArrays
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
        const config = { validateStatus: (status) => { return status < 500 } }
        //note no config as 404 should not occur extracting schema
        const schemaapiurl = `http://localhost:3002/dailylog/newlog`;
        const triggersapiurl = `http://localhost:3002/dailylog/allTriggers`;

        // Make a GET request to the API URL using Axios
        const response1 = await axios.get(schemaapiurl);
        const response2 = await axios.get(triggersapiurl, config);
        console.log(response2.status);
        if(response2.status === 404){
            req.flash('error', 'Triggers not found');
            return res.redirect('/dailylog/showall');
        }
        // Extract data from the response
        const { schemaRows, message } = response1.data;
        const { triggers } = response2.data;
        console.log(schemaRows);
        console.log(triggers);
        // Render the view with the retrieved data
        res.render('./dailylog/new', { triggers: triggers, rows: schemaRows, loggedin: isloggedin });
    } catch (error) {
        console.error('An error occurred while retrieving new log:', error);
        req.flash('error', 'An error occurred while retrieving new log data.');
        res.redirect('/dailylog/showall');
    }
};

exports.getEditLog = async (req, res) => {
    try {
        const snapshotid = req.params.id;
        const { isloggedin, userid } = req.session;
        if (!isloggedin) {
            req.flash('error', 'Must be logged in to edit entries');
            return res.redirect('/login');
        }
        const config = { validateStatus: (status) => { return status < 500 } }
        // Check user permission by consuming an API
        const snapApiUrl = `http://localhost:3002/dailylog/snap/${snapshotid}`;
        const snapResponse = await axios.get(snapApiUrl, config);
        console.log(snapResponse);
        if (snapResponse.status === 404) {
            req.flash('error', 'Invalid Snapshot ID');
            return res.redirect('/dailylog/showall')
        }
        const snapData = snapResponse.data.snapshotData;
        console.log(snapResponse.data.snapshotData);
        const authorId = snapResponse.data.snapshotData[0].user_id;
        console.log(`authorId : ${authorId}`)

        if (authorId !== userid) {
            req.flash('error', 'You are not permitted to edit this snapshot.');
            return res.redirect('/dailylog/showall');
        }
        // Retrieve snapshot context triggers by consuming an API
        const currTrigsUrl = `http://localhost:3002/dailylog/snapTriggers/${snapshotid}`;
        const currTrigsResponse = await axios.get(currTrigsUrl, config);
        const currTriggers = currTrigsResponse.data.triggers;

        // Retrieve all triggers by consuming an API
        const allTrigsUrl = 'http://localhost:3002/dailylog/allTriggers';
        const allTrigsResponse = await axios.get(allTrigsUrl, config);

        const triggers = allTrigsResponse.data.triggers;

        res.render('./dailylog/edit', { currTriggers: currTriggers, triggers: triggers, loggedin: isloggedin, snapshot_id: snapshotid });
    } catch (error) {
        console.error('An error occurred while retrieving log:', error);
        res.redirect('/dailylog/showall');
    }
};

exports.selectLog = async (req, res) => {
    try {
        const snapshotid = req.params.id;
        const { isloggedin, userid } = req.session;
        if (!isloggedin) {
            req.flash('error', 'Must be logged in to view entries');
            return res.redirect('/login');
        }
        const config = { validateStatus: (status) => { return status < 500 } }
        // Check user permission by consuming an API
        const snapApiUrl = `http://localhost:3002/dailylog/snap/${snapshotid}`;
        const snapResponse = await axios.get(snapApiUrl, config);
        console.log(snapResponse);
        if (snapResponse.status === 404) {
            req.flash('error', 'Invalid Snapshot ID');
            return res.redirect('/dailylog/showall')
        }
        const snapData = snapResponse.data.snapshotData;
        const authorId = snapResponse.data.snapshotData[0].user_id;
        if (authorId !== userid) {
            req.flash('error', 'You are not permitted to view this snapshot.');
            return res.redirect('/dailylog/showall');
        }
        // Retrieve snapshot context triggers by consuming an API
        const currTrigsUrl = `http://localhost:3002/dailylog/snapTriggers/${snapshotid}`;
        const currTrigsResponse = await axios.get(currTrigsUrl, config);
        const currTriggers = currTrigsResponse.data.triggers;
        res.render('./dailylog/view', { emotions: snapData, triggers: currTriggers, loggedin: isloggedin, snapshotid: snapshotid });
    } catch (error) {
        console.error('An error occurred while retrieving new log:', error);
        res.redirect('/dailylog/showall');
    }
};


exports.postNewLog = async (req, res) => {
    try {
        const { isloggedin, userid } = req.session;
        const { notes, triggers, ...emotions } = req.body;
        
        // Prepare data to be sent to the API
        const postData = {
            user_id: userid,
            notes: notes,
            emotions: emotions,
        };
        console.log(postData);
        const config = { validateStatus: (status) => { return status < 500 } };
        const apiUrl = 'http://localhost:3002/dailylog/new';

        // Make a POST request to the API endpoint to insert new snapshot
        const apiResponse = await axios.post(apiUrl, postData, config);

        // Check if the request was successful
        if (apiResponse.data.status === 'success') {
            //get the snapshot id for trigger insert
            const snapshot_id = apiResponse.data.snapshotid;
            if (triggers && triggers.length > 0) {
                console.log(triggers);
                const postData2 = {
                    triggers: triggers,
                    snapshot_id: snapshot_id
                };
                const apiResponse2 = await axios.post('http://localhost:3002/dailylog/addTriggers', postData2);
            }
            req.flash('success', triggers && triggers.length > 0 ? 'Successfully added Entry & triggers' : 'Successfully added Entry');
            // Redirect to show all logs
            res.redirect('/dailylog/showall');
        } else {
            // Handle the case where the API request was not successful
            req.flash('error', 'An error occurred while adding new log.');
            res.redirect('/dailylog/new');
        }
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

        // Define endpoints
        const updateLogEndpoint = `http://localhost:3002/dailylog/update/${snapshot_id}`;
        const deleteTriggersEndpoint = `http://localhost:3002/dailylog/delTriggers/${snapshot_id}`;
        const insertTriggersEndpoint = 'http://localhost:3002/dailylog/addTriggers';

        // Define request configuration
        const config = { validateStatus: (status) => status < 500 };

        // Delete existing triggers
        const deleteApiResponse = await axios.delete(deleteTriggersEndpoint, config);

        // Add new triggers if provided
        let insertTriggersResponse;
        if (triggers && triggers.length > 0) {
            const postData = {
                triggers: triggers,
                snapshot_id: snapshot_id
            };
            
            insertTriggersResponse = await axios.post(insertTriggersEndpoint, postData, config);
        }

        // Update log notes if provided
        let updateLogResponse;
        if (notes && notes.length > 0) {
            updateLogResponse = await axios.patch(updateLogEndpoint, { notes }, config);
        }

        // Check for errors
        if ((insertTriggersResponse && insertTriggersResponse.status === 404) || (updateLogResponse && updateLogResponse.status === 404)) {
            req.flash('error', 'Invalid Snapshot ID');
        } else {
            // Create flash message
            let message = 'Log updated successfully';
            if (notes && notes.length > 0) message += ' with new notes';
            if (triggers && triggers.length > 0) message += `${notes ? ' and' : ''} with new triggers`;
            req.flash('success', message);
        }
    } catch (error) {
        console.error('An error occurred while updating log triggers:', error);
        req.flash('error', 'An error occurred while updating log triggers.');
    } finally {
        // Redirect to the appropriate page
        res.redirect('/dailylog/showall');
    }
};

//done?
exports.deleteLog = async (req, res) => {
    try {
        const { isloggedin } = req.session;
        const snapshot_id = req.params.id;
        console.log(snapshot_id);
        const config = { validateStatus: (status) => { return status < 500 } }
        const apiResponse = await axios.delete(`http://localhost:3002/dailylog/delTriggers/${snapshot_id}`, config);

        // Make HTTP request to the API controller to delete the entry
        const apiResponse2 = await axios.delete(`http://localhost:3002/dailylog/del/${snapshot_id}`, config);
        // Check if the request was successful
        if (apiResponse2.data.status === 'success') {
            // Redirect to show all logs
            req.flash('success', 'Successfully deleted entry');
            res.redirect('/dailylog/showall');
            //handle 404 for the snapshot
        } else {
            // Handle the case where the API request was not successful
            req.flash('error', 'An error occurred whilst deleting the  log.');
            res.redirect('/dailylog/new');
        }
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




