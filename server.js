/* eslint-disable no-undef */
/* eslint-disable no-console */
var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;


// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({
     extended: true
}));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/scrapeHW", {
     useNewUrlParser: true
});
var mongoscrapehw = process.env.mongoscrapehw || "mongodb://localhost/scrapeHW";

mongoose.connect(mongoscrapehw);
// Routes

// A GET route for scraping the echoJS website
// $(document).on("click", "#btnScrape", function () {
app.get("/scrape", function (req, res) {
     // First, we grab the body of the html with axios
     axios.get("https://infobeat.com/category/tips/").then(function (response) {
          // Then, we load that into cheerio and save it to $ for a shorthand selector
          var $ = cheerio.load(response.data);

          // Now, we grab every h2 within an Category tag, and do the following:
          $("article h2").each(function () {
               // Save an empty result object
               var result = {};

               // Add the text and href of every link, and save them as properties of the result object
               result.title = $(this)
                    .children("a")
                    .text();
               result.link = $(this)
                    .children("a")
                    .attr("href");

               // Create a new Category using the `result` object built from scraping
               db.Category.create(result)
                    .then(function (dbCategory) {
                         // View the added result in the console
                         console.log(dbCategory);
                    })
                    .catch(function (err) {
                         // If an error occurred, log it
                         console.log(err);
                    });
          });

          // Send a message to the client
          console.log("i'm getting here");
          res.send("Scrape Complete");
     });
});
// },
// Route for getting all Categoriess from the db
app.get("/category/tips", function (req, res) {
     // Grab every document in the Categoriess collection
     db.Category.find({})
          .then(function (dbCategory) {
               // If we were able to successfully find Categoriess, send them back to the client
               res.json(dbCategory);
          })
          .catch(function (err) {
               // If an error occurred, send it to the client
               res.json(err);
          });
});


// Route for grabbing a specific Categories by id, populate it with it's note
app.get("/category/tips/:id", function (req, res) {
     // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
     db.Category.findOne({
               _id: req.params.id
          })
          // ..and populate all of the notes associated with it
          .populate("note")
          .then(function (dbCategory) {
               // If we were able to successfully find an Category with the given id, send it back to the client
               res.json(dbCategory);
          })
          .catch(function (err) {
               // If an error occurred, send it to the client
               res.json(err);
          });
});

// Route for saving/updating an Category's associated Note
app.post("/category/tips/:id", function (req, res) {
     // Create a new note and pass the req.body to the entry
     db.Note.create(req.body)
          .then(function (dbNote) {
               // If a Note was created successfully, find one Category with an `_id` equal to `req.params.id`. Update the Category to be associated with the new Note
               // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
               // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
               return db.Category.findOneAndUpdate({
                    _id: req.params.id
               }, {
                    note: dbNote._id
               }, {
                    new: true
               });
          })
          .then(function (dbCategory) {
               // If we were able to successfully update an Category, send it back to the client
               res.json(dbCategory);
          })
          .catch(function (err) {
               // If an error occurred, send it to the client
               res.json(err);
          });
});

// Start the server
app.listen(PORT, function () {
     console.log("App running on port " + PORT + "!");
});
