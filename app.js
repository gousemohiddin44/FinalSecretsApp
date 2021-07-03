//require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
/*const bcrypt = require("bcrypt");
const saltRounds = 10;*/
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
//const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));

app.use(session({
  secret: 'the secret to happiness is working hard',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set('useCreateIndex', true);

//modified schema from JS object to new mongoose schema object.
const userSchema = new mongoose.Schema ({
  email : String,
  password : String,
  secret : String
});

userSchema.plugin(passportLocalMongoose);
//userSchema.plugin(findOrCreate);

//creating a plugin . always place before modeling database

//userSchema.plugin(encrypt , {secret : process.env.SECRET , encryptedFields : ["password"]});

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/*passport.use(new GoogleStrategy({
    clientID:  process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/Secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));*/


app.get("/",(req,res)=>{
  res.render("home");
});

app.get("/login",(req,res)=>{
  res.render("login");
});

app.get("/register",(req,res)=>{
  res.render("register");
});

app.get("/secrets",(req,res)=>{
  /*if(req.isAuthenticated()){
    res.render("secrets");
  } else{
    res.redirect("/login");
  }*/
  User.find({secret : {$ne: null}},(err,foundUser)=>{
    if(err){
      console.log(err);
    } else{
      if(foundUser){
      res.render("secrets",{usersWithSecrets:foundUser});
    }
    }
  });
});

app.get("/logout",(req,res)=>{
  req.logout();
  res.redirect("/");
});

app.get("/submit",(req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit");
  } else{
    res.redirect("/login");
  }
});

/*app.get('/auth/google', passport.authenticate('google', {
  scope: ["profile"] }));*/

//post request from register page. using dotnev and mongoose-encryption
/*app.post("/register",(req,res)=>{

  const newUser = new User({
    email : req.body.username,
    password : md5(req.body.password)
  });

  newUser.save(function(err){
    if(err) console.log(err);
    else res.render("secrets");
  });

});*/

//using bcrypt
/*app.post("/register",(req,res)=>{

  bcrypt.hash(req.body.password , saltRounds, function(err, hash) {
    // Store hash in your password DB.
    const newUser = new User({
      email : req.body.username,
      password : hash
    });

    newUser.save(function(err){
      if(err) console.log(err);
      else res.render("secrets");
    });

});
});*/


//using passport.js
app.post("/register",(req,res)=>{
  User.register({ username  : req.body.username} , req.body.password , function(err,user){
    if(err){
      console.log(err);
      res.redirect("/login");
    } else{
      passport.authenticate('local')(req,res,()=>{
        res.redirect("/secrets");
      });
    }
  });

});

//post request from login page
/*app.post("/login",(req,res)=>{
  const usename = req.body.username;
  const passcode = md5(req.body.password);

  User.findOne({email:usename},function(err,foundUser){
    if(err) console.log(err);
    else{
      if(foundUser.password === passcode){
        res.render("secrets");
      }
    }
  });

});*/

//using bcrypt
/*app.post("/login",(req,res)=>{

    const usename = req.body.username;
    const passcode = req.body.password;

    User.findOne({email:usename},function(err,foundUser){
      if(err) console.log(err);
      else{
        bcrypt.compare(passcode , foundUser.password, function(err, result) {
            if(result == true){
              res.render("secrets");
            }
        });
      }
    });

});*/

app.post("/login",(req,res)=>{

  const user = new User({
    username : req.body.username,
    password : req.body.password
  });

  req.login(user , function(err){
    if(err){
      console.log(err);
      res.redirect("/home");
    } else{
      passport.authenticate('local')(req,res,()=>{
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit",(req,res)=>{
  const submitedSecret = req.body.secret;

  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    } else{
      foundUser.secret = submitedSecret;
      foundUser.save();
      res.redirect("/secrets")
    }
  });

})

app.listen(process.env.PORT || 3000,()=>{
  console.log("Server running on port 3000");
});


//SECRET=snitchesendupinditches.
