
const moment = require('moment');
const bcrypt = require('bcrypt');
const axios = require('axios');

exports.getLogin = (req, res) => {
    const { isloggedin } = req.session;
    if (isloggedin) {
        req.flash('error', 'Already logged in');
        return res.redirect('/dailylog/showall');
    }
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
    if (isloggedin) {
        req.flash('error', 'Already logged in');
        return res.redirect('/dailylog/showall');
    }
    res.render('./users/register', { loggedin: isloggedin });
};


//done
exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    console.log(username);
    try {
        // Consume the API to retrieve user password
        const passwordResponse = await axios.get(`http://localhost:3002/userDetails/${username}`);
        const userDetails = passwordResponse.data.result;
        const hashedPasswordFromDB = userDetails.password;
        // Compare the hashed password from the database with the provided password
        const result = await bcrypt.compare(password, hashedPasswordFromDB);
        if (result) {
            // Passwords match, set session variables and redirect to dashboard
            req.session.isloggedin = true;
            req.session.userid = userDetails.user_id;
            req.session.username = req.body.username;
            req.session.firstname = userDetails.first_name;
            req.session.lastname = userDetails.last_name;
            req.session.email = userDetails.email;
            req.session.signup = userDetails.signup_date;
            req.flash('success', 'Login successful, welcome back!');
            res.redirect('/dailylog/showall');
        } else {
            // Passwords don't match
            req.flash('error', 'Incorrect username or password.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('An error occurred during login:', error);
        req.flash('error', 'An error occurred during login.');
        res.redirect('/login');
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

//done- needs status fixed
exports.postRegister = async (req, res) => {
    const { username, email, password, firstname, lastname } = req.body;

    try {
        // Insert the new user with hashed password by calling an API
        const postdata = {
            username: username,
            email: email,
            password: password,
            firstname: firstname,
            lastname: lastname
        }
        const apiUrl = 'http://localhost:3002/register';
        console.log(postdata);
        const config = { validateStatus: (status) => status < 500 };
        const response = await axios.post(apiUrl, postdata,config);

        // Handle the response based on status
        if (response.data.status === 'success') {
            req.flash('success', 'User successfully registered, please log in');
            return res.redirect('/login');
        } else {
            req.flash('error', 'Failed to register user - user already exists');
            return res.redirect('/register');
        }
    } catch (error) {
        console.error('An error occurred while registering the user:', error);
        req.flash('error', 'An error occurred while registering the user.');
        return res.redirect('/register');
    }
};

exports.getMyAccount = async (req, res) => {
    try {
        const { isloggedin, userid, username, firstname, lastname, email, signup } = req.session;

        const userinfo = { username, firstname, lastname, email, signup };

        if (!isloggedin) {
            req.flash('error', 'Please log in');
            return res.redirect('/login');
        }

        const config = { validateStatus: (status) => status < 500 };

        apiUrl = `http://localhost:3002/dailylog/entryCounts/${userid}`;
        const apiResponse = await axios.get(apiUrl, config);

        if (apiResponse.status === 404) {
            const numlogs = 0;
            const firstEntry = 0;
            const lastEntry = 0;
            console.log(numlogs);
            return res.render('./users/account.ejs', { user: userinfo, loggedin: isloggedin, numlogs, firstEntry, lastEntry });
        }

        const { totalEntries } = apiResponse.data;
        console.log(totalEntries);
        const countrows = totalEntries[0];
        const numlogs = countrows['COUNT(snapshot_id)'];
        const firstEntry = moment(countrows['first_entry']).format('dddd, MMMM Do YYYY, h:mm:ss a');
        const lastEntry = moment(countrows['last_entry']).format('dddd, MMMM Do YYYY, h:mm:ss a');
        const signupDate = moment(userinfo.signup).format('dddd, MMMM Do YYYY, h:mm:ss a');

        console.log(numlogs);
        res.render('./users/account.ejs', { user: userinfo, loggedin: isloggedin, numlogs, firstEntry, lastEntry, signupDate });
    } catch (error) {
        console.error('An error occurred during login:', error);
        req.flash('error', 'An error occurred during login.');
        res.redirect('/login');
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { isloggedin, userid} = req.session;
    if(!isloggedin){
        req.flash('error', 'Please log in');
        return res.redirect('/login');
    }
    apiUrl =  `http://localhost:3002/deleteAccount/${userid}`;
    const config = { validateStatus: (status) => status < 500 };
    const apiResponse = await axios.delete(apiUrl, config);
    console.log(apiResponse);
    const message = apiResponse.data.message;

    if(apiResponse.data.status === 'success'){
        req.flash('success','Account deleted');
        res.redirect('/logout');
    }
}
catch (error) {
    console.error('An error occurred during Account deletion:', error);
    req.flash('error', 'An error occurred during account deletion.');
    res.redirect('/account');
}
}