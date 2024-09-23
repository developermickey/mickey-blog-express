const express = require("express");
const app = express();
const PORT = 3000;
const path = require("path");
const session = require('express-session');
const userModel = require("./models/Post");
const bcrypt = require("bcrypt");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(session({
    secret: 'hihihi', // replace with your secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.get("/", (req, res) => {
    res.render("index", { title: "Home" });
});
app.get("/about", (req, res) => {
    res.render("about", { title: "About Us" });
});
app.get("/blog", (req, res) => {
    res.render("blog", { title: "Blog" });
});
app.get("/contact", (req, res) => {
    res.render("contact", { title: "Contact Us" });
});

const redirectIfLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        return res.redirect("/profile"); // Redirect to profile if logged in
    }
    next(); // Proceed to the next middleware or route handler
};

app.get("/login", redirectIfLoggedIn, (req, res) => {
    res.render("login", { title: "Login" });
});
app.get("/signup", redirectIfLoggedIn, (req, res) => {
    res.render("sign", { title: "Sign Up" });
});

app.get("/profile", (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login"); // Redirect to login if not logged in
    }
    res.render("profile", { title: "Profile" });
});

app.post("/create", async (req, res) => {
    try {
        let { name, email, password } = req.body;

        // Generate salt and hash password
        bcrypt.genSalt(10, async (err, salt) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Server Error");
            }

            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Server Error");
                }

                let user = await userModel.create({
                    name,
                    email,
                    password: hash
                });
                req.session.userId = user._id; // Set session on signup
                res.redirect("/profile");
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

app.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;

        let user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).send("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid email or password");
        }

        // Set session on successful login
        req.session.userId = user._id; // or any other user info you need

        res.redirect("/profile");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

app.get("/logout", (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error(err);
                return res.status(500).send("Server Error");
            }
            res.redirect("/login"); // Redirect after logout
        });
    } else {
        res.redirect("/login"); // If there is no session, redirect to login
    }
});

app.listen(PORT, () => {
    console.log("Server listening on port ", PORT);
});
