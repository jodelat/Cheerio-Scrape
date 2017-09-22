//MongoDb URI = mongodb://heroku_jpzxbq4p:t540oofdmtu9kl27h0ih1u8qtb@ds147044.mlab.com:47044/heroku_jpzxbq4p



var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var Note = require("./models/notes.js");
var Article = require("./models/article.js");

var request = require("request");
var cheerio = require("cheerio");

mongoose.Promise = Promise;
var PORT = process.env.PORT || 8080;



var app = express();


app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));


app.use(express.static("public"));


mongoose.connect("mongodb://heroku_jpzxbq4p:t540oofdmtu9kl27h0ih1u8qtb@ds147044.mlab.com:47044/heroku_jpzxbq4p/nytimesScrape");
var db = mongoose.connection;


db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});


db.once("open", function() {
  console.log("Mongoose connection successful.");
});



app.get("/scrape", function(req, res) {
  Article.collection.drop()
  request("http://www.nytimes.com", function(error, response, html) {
    var $ = cheerio.load(html);
    $('h2.story-heading').each(function(i, element) {
      var result = {};
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      var entry = new Article(result);

      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });
    });
  });
});


app.get("/articles", function(req, res) {

  Article.find({}, function(error, docs) {

    if (error) {
      console.log(error);
    } else {
      res.json(docs);
    }
  });
});


app.get("/articles/:id", function(req, res) {

  Article.findById(req.params.id)

    .populate("note")

    .exec(function(error, doc) {

      if (error) {
        console.log(error);
      } else {
        res.json(doc);
      }
    });
});


app.post("/articles/:id", function(req, res) {

  var newNote = new Note(req.body);

  newNote.save(function(error, doc) {

    if (error) {
      console.log(error);
    } else {

      Article.findOneAndUpdate({
          "_id": req.params.id
        }, {
          "note": doc._id
        })

        .exec(function(err, doc) {

          if (err) {
            console.log(err);
          } else {
            res.send(doc);
          }
        });
    }
  });
});

app.listen(PORT, function() {
  console.log("App running on port" + PORT);
});
