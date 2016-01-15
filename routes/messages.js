/* Messages Controller */
var express = require('express'); // must for nodeJS
var router = express.Router(); // must for nodeJS
var multiparty = require('multiparty');
const fs = require('fs');

var mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST



// Using use will make sure that every requests that hits this controller will pass through these functions.
router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}));


router.route('/dummy/removeAll').get(function(req, res, next){
   mongoose.model('Messages').remove({}, function(err,removed) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  res.format({
                      //HTML response will set the location and redirect back to the home page. 
                      //You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("messages");
                        // And forward to success page
                        res.redirect("/messages");
                    },
                    //JSON response will show the newly created blob
                    json: function(){
                        res.json(db);
                    }
                });
              }
  }); 
})

router.route('/dummy/:num?').get(function(req, res, next){
    var loremIpsum = require('lorem-ipsum');
    var messages = [];
    var amount = (!isNaN(req.params.num))?req.params.num:5;
    for(num=1; num <= amount; num++){
      messages.push({'title': loremIpsum({count: 2, units: 'words'}), 'message': loremIpsum({count: 5, units: 'sentences'})});
    }
    (mongoose.model('Messages')).collection.insert(messages, onInsert); 

    function onInsert(err, db) {
        if (err) {
             res.send("There was a problem adding the information to the database.");
              return;
        } else {
                  console.log('Created dummy messages: ' + db.result.n) //JSON.stringify(db));
                  res.format({
                      //HTML response will set the location and redirect back to the home page. 
                      //You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("messages");
                        // And forward to success page
                        res.redirect("/messages");
                    },
                    //JSON response will show the newly created blob
                    json: function(){
                        res.json(db);
                    }
                });

        }
    }
});

//build the REST operations at the base for blobs
//this will be accessible from http://127.0.0.1:3000/messages if the default route for / is left unchanged
router.route('/')
    //GET all blobs
    .get(function(req, res, next) {

    	var defaultSort = {'title': 'desc', 'date': 'asc'};
    	var perPage = 5;
    	var page = 0; // pages start from 0
    	var tableRows = 0;
    	var sort = {created: 'asc'};
    	var filters = {};
    	filters.created_asc = {'key': 'created_asc', 'value': 'Date [A-Z]', 'selected': false};
    	filters.created_desc = {'key': 'created_desc', 'value': 'Date [Z-A]', 'selected': false};
    	filters.title_asc = {'key': 'title_asc', 'value': 'Title [A-Z]', 'selected': false};
    	filters.title_desc = {'key': 'title_desc', 'value': 'Title [Z-A]', 'selected': false};
    	filters.messsage_asc = {'key': 'message_asc', 'value': 'Message [A-Z]', 'selected': false};
    	filters.message_desc = {'key': 'message_desc', 'value': 'Message [Z-A]', 'selected': false};


    	if(!isNaN(req.query.page))
    		page = parseInt(req.query.page) -1;

    	if(!isNaN(req.query.limit))
    		perPage = parseInt(req.query.limit)

    	if(req.query.orderBy in filters){
    		filters[req.query.orderBy].selected = true;
    		sortArr = (req.query.orderBy).split("_");    		
    		sort = {};
    		sort[sortArr[0]] = (sortArr[1] === 'asc')?1:-1;
    	}

    	var PrevPage = (page -1) < 0?1:page;

        //retrieve all blobs from Monogo
        
        mongoose.model('Messages')
        	.find({})
        	.sort(sort) // criteria can be asc, desc, ascending, descending, 1, or -1
        	.limit(perPage)
        	.skip(perPage * page)
        	.exec(function (err, messages) {
              if (err) {
                  return console.error(err);
              } else {

			    mongoose.model('Messages').count().exec(function(err, count) {
		    		if (err) {
		                  return console.error(err);
		            }
		            var NextPage = (page > count)?page-1:page;
		            var data = {"messages" : messages, "page": page, "pages": Math.ceil(count / perPage) -1, "PrevPage": PrevPage, "NextPage": NextPage}
	                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
	                res.format({
	                      //HTML response will render the index.jade file in the views/blobs folder. We are also setting "blobs" to be an accessible variable in our jade view
	                    html: function(){
	                    	data["title"] = 'All my messages';
	                    	data["filters"] = filters;
	                    	data["pagination"] = (Math.ceil(count / perPage) > 1);
	                        res.render('messages/index', data);
	                    },
	                    //JSON response will show all blobs in JSON format
	                    json: function(){
	                        res.json(data);
	                    }
	                });
	                // console.log(data);
		    	});
              }     
        });
    })
    //POST a new Message
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms

        var form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
         // console.log('multiparty', err, fields, files);
          req.fields = fields;
          req.files = files;
          insertCallback(req, res);
        });

        function insertCallback(req, res){
          //console.log(req.fields, req.files, res);
          var title = req.fields.title;
          var message = req.fields.message;
          if(title.length == 0 || message.length == 0){
            if(title.length == 0 && message.length != 0){
              res.send("A title is required.");
            }else if(title.length != 0 && message.length == 0){
              res.send("A message is required.");
            }else if(title.length == 0 && message.length == 0){
              res.send("A title & a message is required.");
            }    
            return false; // Exit with error message
          }

          //call the create function for our database
          mongoose.model('Messages').create({
              title : title,
              message : message
          }, function (err, db) {
                if (err) {
                    res.send("There was a problem adding the information to the database.");
                } else {
                    //Message has been created
                    console.log('POST creating new message: ' + db);
                   // console.log(req.files.logName, (req.files.logName).length);
                    // Has attachment
                    if((req.files.file).length == 1 && req.files.file[0].originalFilename != ''){
                      var tempfile = req.files.file[0].path;
                      fs.readFile(tempfile, function (err, data) {
                        var fileExt = (tempfile).split(".");
                        fileExt = fileExt[fileExt.length - 1];
                        var newPath = __dirname + "/../public/uploads/message_"+db._id+"."+fileExt;
                        console.log('new path', newPath)
                        fs.writeFile(newPath, data, function (err) {
                          mongoose.model('Messages').update({ _id: db._id }, {attachment: "message_"+db._id+"."+fileExt, originalFilename: req.files.file[0].originalFilename}, {}, function(err, doc){
                            console.log(doc);
                            res.format({
                                html: function(){
                                  res.location("messages"); // If it worked, set the header so the address bar doesn't still say /messages
                                  res.redirect("/messages"); // And forward to success page
                                },
                                json: function(){
                                  db.attachement = "/public/uploads/message_"+db._id+"."+fileExt;
                                  res.json(db);
                                }
                            });
                          });
                        });
                      }); 
                      return;                  
                    }

                    // No file attached
                    res.format({
                        //HTML response will set the location and redirect back to the home page. 
                        //You could also create a 'success' page if that's your thing
                      html: function(){
                          // If it worked, set the header so the address bar doesn't still say /messages
                          res.location("messages");
                          // And forward to success page
                          res.redirect("/messages");
                      },
                      //JSON response will show the newly created blob
                      json: function(){
                          res.json(db);
                      }
                  });
                }
          }); // End Create Message
        }
        return;
    });

// web GUI to insert message
router.get('/new', function(req, res) {
    res.render('messages/new', { title: 'Add a New Message' });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Messages').findById(id, function (err, message) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                 },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(blob);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Messages').findById(req.id, function (err, message) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + message._id);
        var title = message.title,
            message = message.message,
            created = message.created;
        res.format({
          html: function(){
              res.render('blobs/show', {
                "title" : title,
                "message" : message,
                "created" : created
              });
          },
          json: function(){
              res.json(message);
          }
        });
      }
    });
  });

//GET the individual message by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the blob within Mongo
    mongoose.model('Messages').findById(req.id, function (err, messages) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the blob
            console.log('GET Retrieving ID: ' + messages._id);
            //format the date properly for the value to show correctly in our edit form
        	var title = messages.title,
           		message = messages.message,
            	created = messages.created;
            res.format({
                //HTML response will render the 'edit.jade' template
                html: function(){
                       res.render('messages/edit', {
                          title: 'Messages' + messages._id,
                          "message" : messages,
                      });
                 },
                 //JSON response will return the JSON output
                json: function(){
                       res.json(message);
                 }
            });
        }
    });
});

//POST to update a message by ID
router.post('/:id/edit', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes


        var form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
         // console.log('multiparty', err, fields, files);
          req.fields = fields;
          req.files = files;

          var title = req.fields.title;
          var message = req.fields.message;

          if(title.length == 0 || message.length == 0){
            if(title.length == 0 && message.length != 0){
              res.send("A title is required.");
            }else if(title.length != 0 && message.length == 0){
              res.send("A message is required.");
            }else if(title.length == 0 && message.length == 0){
              res.send("A title & a message is required.");
            }    
           return false; // Exit with error message
           }
          updateCallback(req, res);
        });

        function updateCallback(req, res){
          // check id exist
          mongoose.model('Messages').findById(req.params.id, function (err, message) {
              if (err) {
                  res.send("There was a problem updating the information to the database: " + err);
                  return false;
              }else{
                // check if file uploaded, then delete previous
                if((req.files.file).length == 1 && req.files.file[0].originalFilename != ''){
                  fs.unlink(__dirname + "/../public/uploads/"+req.fields.curr_file, function(){
                    var tempfile = req.files.file[0].path;
                    fs.readFile(tempfile, function (err, data) {
                      var fileExt = (tempfile).split(".");
                      fileExt = fileExt[fileExt.length - 1];
                      var newPath = __dirname + "/../public/uploads/message_"+req.params.id+"."+fileExt;
                      fs.writeFile(newPath, data, function (err) {
                        var attachment = "message_"+req.params.id+"."+fileExt;
                        mongoose.model('Messages').update({ _id: req.params.id }, {attachment: attachment, originalFilename: req.files.file[0].originalFilename,title: req.fields.title, message: req.fields.message}, {}, function(err, doc){
                          res.format({
                              html: function(){
                                res.location("messages"); // If it worked, set the header so the address bar doesn't still say /messages
                                res.redirect("/messages"); // And forward to success page
                              },
                              json: function(){
                                db.attachement = "/public/uploads/message_"+db._id+"."+fileExt;
                                res.json(db);
                              }
                          });
                        });
                      });
                    }); 
                  });
              }
            }
          });
        };
});

//DELETE a Message by ID
router.delete('/:id/edit', function (req, res){
    //find blob by ID
    mongoose.model('Messages').findById(req.id, function (err, message) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            message.remove(function (err, message) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + message._id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                          html: function(){
                               res.redirect("/messages");
                         },
                         //JSON returns the item with the message that is has been deleted
                        json: function(){
                               res.json({message : 'deleted',
                                   item : message
                               });
                         }
                      });
                }
            });
        }
    });
});
module.exports = router;  // must for nodeJS