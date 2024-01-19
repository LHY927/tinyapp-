const getUserByEmail = require('./helpers');
const express = require("express");
var cookieSession = require('cookie-session')
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2']
  }))

const urlDatabase = {
    b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "AAXA4n",
    },
    i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW",
    },
};

const users = {
    AAXA4n: {
      id: "AAXA4n",
      email: "user@example.com",
      password: "purple-monkey-dinosaur",
    },
    aJ48lW: {
        id: "aJ48lW",
        email: "user1@example.com",
        password: "purple1-monkey-dinosaur",
    }
};

app.get("/", (req, res) => {
    if(req.session.user_id != undefined){
        res.redirect("/urls");
    }else{
        res.redirect("/login");
    }
});

app.get("/urls", (req, res) => {
    const templateVars = {
      user: undefined,
      urls: undefined
    };
    if(req.session.user_id != undefined){
        templateVars["user"] = users[req.session.user_id];
        templateVars["urls"] = urlsForUser(req.session.user_id);
    }
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    if(req.session.user_id != undefined){
        if (typeof users[req.session.user_id] == 'undefined'){
            res.redirect("/login");
            return;
        }
    }

    const templateVars = {
        user: undefined,
        urls: undefined
      };
    if(req.session.user_id != undefined){
        templateVars["user"] = users[req.session.user_id];
        templateVars["urls"] = urlsForUser(req.session.user_id);
    }
    res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
    if(!(req.params.id in urlDatabase)){
        res.status(400).send("The shortened ID does not exist.");
    }else if(req.session.user_id != undefined){
        //if can access cookie
        if (typeof users[req.session.user_id] == 'undefined'){
            //if haven't logged in
            res.redirect("/login");
            return;
        }else if(urlDatabase[req.params.id].userID != req.session.user_id){
            //if do not own the URL
            res.status(403).send("The URL does not owned by the user ID")
            return;
        }
    }

    const templateVars = { 
        user: undefined,
        id: req.params.id, 
        longURL: urlDatabase[req.params.id].longURL
    };
    if(req.session.user_id != undefined){
        templateVars["user"] = users[req.session.user_id];
    }
    res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
    if(req.session.user_id != undefined){
        if (typeof users[req.session.user_id] != 'undefined'){
            res.redirect("/urls");
            return;
        }
    }
    res.render("register");
});

app.get("/login", (req, res) => {
    if(req.session.user_id != undefined){
        if (typeof users[req.session.user_id] != 'undefined'){
            res.redirect("/urls");
            return;
        }
    }
    res.render("login");
});

app.post("/urls", (req, res) => {
    if(req.session.user_id != undefined){
        if (typeof users[req.session.user_id] == 'undefined'){
            res.status(403).send("Please login to shorten URLs.");
            return;
        }
    }
    url_id = generateRandomString();
    urlDatabase[url_id] = {};
    urlDatabase[url_id].longURL = req.body.longURL;
    urlDatabase[url_id].userID = req.session.user_id;
    res.redirect("/urls/" + url_id);
});

app.post("/urls/:id", (req, res) => {
    if(req.params.id in urlDatabase){
        if(req.session.user_id != undefined){
            //if can access cookie
            if (typeof users[req.session.user_id] == 'undefined'){
                //if haven't logged in
                res.redirect("/login");
                return;
            }else if(urlDatabase[req.params.id].userID != req.session.user_id){
                //if do not own the URL
                res.status(403).send("The URL does not owned by the user ID")
                return;
            }
        }
        urlDatabase[req.params.id].longURL = req.body.longURL;
    }else{
        res.status(400).send("id does not exist");
        return;
    }

    res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
    if(req.params.id in urlDatabase){
        if(req.session.user_id != undefined){
            //if can access cookie
            if (typeof users[req.session.user_id] == 'undefined'){
                //if haven't logged in
                res.redirect("/login");
                return;
            }else if(urlDatabase[req.params.id].userID != req.session.user_id){
                //if do not own the URL
                res.status(403).send("The URL does not owned by the user ID")
                return;
            }
        }
        delete urlDatabase[req.params.id];
    }else{
        res.status(400).send("id does not exist");
        return;
    }

    res.redirect("/urls");
});

app.post("/login", (req, res) => {
    const user = getUserByEmail(req.body.email, users);
    if(user == false){
        //userContainEmail return false if the user does not exist
        res.status(403).send("Does not exist user that registered with the email, please try another email.");
    }else if(!bcrypt.compareSync(req.body.password, user["password"])){
        res.status(403).send("Password does not match.");
    }else{
        req.session.user_id = user.id;
        res.redirect("/urls");
    }
});

app.post("/logout", (req, res) => {
    req.session['user_id'] = null;
    res.redirect("/login");
});

app.post("/register", (req, res) => {
    if(req.body.email.length == 0 || req.body.password.length == 0){
        res.status(400).send("email and passwords are required fields");
        return;
    }else if(getUserByEmail(req.body.email, users)){
        //userContainEmail will return the user object if exist
        //In that case, return as the user already exist.
        return
    }
    
    const user_id = generateRandomString();
    users[user_id] = {
        id: user_id,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      }
    req.session.user_id = user_id;
    res.redirect("/urls");
});

const generateRandomString = function() {
    const length = 6;
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

const urlsForUser = function(id){
    const result = {};
    for(const item in urlDatabase){
        if(urlDatabase[item].userID == id){
            result[item] = urlDatabase[item];
        }
    }
    return result;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});