//imports 
require('dotenv').config(); //import dotenv
const express = require('express'); //import express
const mongoose = require('mongoose'); //import mongoose
const session = require('express-session'); //import express-session

const app = express();
const PORT = process.env.PORT || 8080;

// database connection
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', (error) => console.log(error));

db.once('open', () => console.log("Database connected!"));

// middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false
}));
app.use((req, res, next) => {
    res.locals.user = req.session.message;
    delete req.session.message;
    next();
});
// Serve static files from the 'uploads' folder
app.use('/uploads', express.static('public/uploads'));


//set template engine
app.set('view engine', 'ejs');

//routes
app.use("", require("./routes/routes"));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); //server
