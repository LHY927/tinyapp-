const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

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
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
    // console.log(req.headers.cookie.split('=')[1])
    // console.log(users)
    const templateVars = {
      user: undefined,
      urls: undefined
    };
    if(req.headers.cookie != undefined){
        console.log(users[req.headers.cookie.split('=')[1]]);
        templateVars["user"] = users[req.headers.cookie.split('=')[1]];
        templateVars["urls"] = urlsForUser(req.headers.cookie.split('=')[1]);
    }

    console.log("Send to urls")
    console.log(templateVars)
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    if(req.headers.cookie != undefined){
        if (typeof users[req.headers.cookie.split('=')[1]] == 'undefined'){
            res.redirect("/login");
            return;
        }
    }
    res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
    if(!(req.params.id in urlDatabase)){
        res.status(400).send("The shortened ID does not exist.");
    }else if(req.headers.cookie != undefined){
        //if can access cookie
        if (typeof users[req.headers.cookie.split('=')[1]] == 'undefined'){
            //if haven't logged in
            res.redirect("/login");
            return;
        }else if(urlDatabase[req.params.id].userID 
            != req.headers.cookie.split('=')[1]){
            //if do not own the URL
            res.status(403).send("The URL does not owned by the user ID")
            return;
        }
    }

    const templateVars = { 
        id: req.params.id, 
        longURL: urlDatabase[req.params.id].longURL
    };
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
    if(req.headers.cookie != undefined){
        if (typeof users[req.headers.cookie.split('=')[1]] != 'undefined'){
            res.redirect("/urls");
            return;
        }
    }
    res.render("register");
});

app.get("/login", (req, res) => {
    if(req.headers.cookie != undefined){
        if (typeof users[req.headers.cookie.split('=')[1]] != 'undefined'){
            res.redirect("/urls");
            return;
        }
    }
    res.render("login");
});

app.post("/urls", (req, res) => {
    if(req.headers.cookie != undefined){
        if (typeof users[req.headers.cookie.split('=')[1]] == 'undefined'){
            res.status(403).send("Please login to shorten URLs.");
            return;
        }
    }
    urlDatabase[generateRandomString()].longURL = req.body.longURL;
    console.log(req.body); // Log the POST request body to the console
    res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
    if(req.params.id in urlDatabase){
        if(req.headers.cookie != undefined){
            //if can access cookie
            if (typeof users[req.headers.cookie.split('=')[1]] == 'undefined'){
                //if haven't logged in
                res.redirect("/login");
                return;
            }else if(urlDatabase[req.params.id].userID 
                != req.headers.cookie.split('=')[1]){
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
        if(req.headers.cookie != undefined){
            //if can access cookie
            if (typeof users[req.headers.cookie.split('=')[1]] == 'undefined'){
                //if haven't logged in
                res.redirect("/login");
                return;
            }else if(urlDatabase[req.params.id].userID 
                != req.headers.cookie.split('=')[1]){
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
    console.log(req.body.email);
    console.log(req.body.password);

    const user = usersContainEmail(req.body.email);
    console.log(user);
    if(user == false){
        //userContainEmail return false if the user does not exist
        res.status(403).send("Does not exist user that registered with the email, please try another email.");
    }else if(user["password"] != req.body.password){
        res.status(403).send("Password does not match.");
    }else{
        res.cookie("user_id", user.id).redirect("/urls");
    }
});

app.post("/logout", (req, res) => {
    console.log(req.body.user_id);
    res.clearCookie("user_id").redirect("/login");
});

app.post("/register", (req, res) => {
    console.log(req.body.email);
    console.log(req.body.password);
    if(req.body.email.length == 0 || req.body.password.length == 0){
        res.status(400).send("email and passwords are required fields");
        return;
    }else if(usersContainEmail(req.body.email)){
        //userContainEmail will return the user object if exist
        //In that case, return as the user already exist.
        return
    }
    
    const user_id = generateRandomString();
    users[user_id] = {
        id: user_id,
        email: req.body.email,
        password: req.body.password
      }
    console.log(users);
    res.cookie("user_id", user_id).redirect("/urls");
});

function generateRandomString() {
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

function usersContainEmail(email){
    for(const user in users){
        if(email == users[user].email){
            //return the user object if found
            return users[user];
        }
    }
    //return false if not found
    return false;
}

function urlsForUser(id){
    const result = {};
    console.log("urlsForUser:")
    for(const item in urlDatabase){
        console.log(urlDatabase[item]);
        console.log(id);
        if(urlDatabase[item].userID == id){
            result[item] = urlDatabase[item];
        }
    }
    console.log(result);
    return result;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});