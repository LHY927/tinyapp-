const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
    AAXA4n: {
      id: "AAXA4n",
      email: "user@example.com",
      password: "purple-monkey-dinosaur",
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
      urls: urlDatabase
    };
    if(req.headers.cookie != undefined){
        console.log(users[req.headers.cookie.split('=')[1]]);
        templateVars["user"] = users[req.headers.cookie.split('=')[1]];
    }
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
    res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
    const longURL = req.params.id;
    res.redirect(longURL);
});

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/urls", (req, res) => {
    urlDatabase[generateRandomString()] = req.body.longURL;
    console.log(req.body); // Log the POST request body to the console
    res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
    if(req.params.id in urlDatabase){
        urlDatabase[req.params.id] = req.body.longURL;
    }
    res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
    if(req.params.id in urlDatabase){
        delete urlDatabase[req.params.id];
    }
    res.redirect("/urls");
});

app.post("/login", (req, res) => {
    console.log(req.body.username);
    res.cookie("username", req.body.username).redirect("/urls");
});

app.post("/logout", (req, res) => {
    console.log(req.body.username);
    res.clearCookie("user_id").redirect("/urls");
});

app.post("/register", (req, res) => {
    console.log(req.body.email);
    console.log(req.body.password);
    if(req.body.email.length == 0 || req.body.password.length == 0){
        res.status(400).send("email and passwords are required fields");
    }else{
        for(const user in users){
            if(req.body.email == users[user].email){
                res.status(400).send("email exist, please register with other email");
            }
        }
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});