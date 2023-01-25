require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");

//require these three packages
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");


//set up a session to have a secret, resave to false and set saveUninitilized to false
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

//initialize passport and use passport to manage our session
app.use(passport.initialize());
app.use(passport.session());


mongoose.set('strictQuery',false);
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
  email:String,
  password:String
});

//set up our userSchema to use passport local mongoose as a plugin
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);
//set passportlocalmongoose to use a local login strategy
passport.use(User.createStrategy());
//set the passport to serialize and deserialize our user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req,res) {
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

// check to see if someone went to /secrets page, check whether they are authenticated, if yes go to secrets page, if not go to login page.
app.get("/secrets", function(req,res){
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req,res){
  req.logout(function(err){
    if (err) {
      return next (err);
    } res.redirect("/");
});
});

app.post("/register", function(req,res){

  User.register({username:req.body.username}, req.body.password, function(err,user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req, res) {
  const user = new User ({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});



app.listen(port, () => console.log(`Server started at port: ${port}`)
);
