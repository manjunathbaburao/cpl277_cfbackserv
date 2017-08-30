
/**
 * The Foodie App - showcasing Cloud Foundry Backing Services on SAP Cloud Platform
 */

//List down all the required dependencies for the Node-Express app
var express = require('express'); 
var app = express();
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var statics = require('serve-static');
var http  = require("http");
var path = require("path");
var cfenv = require("cfenv");

//Add modules for the backing services we will use
<Import module for Postgres>
<Import module for MongoDB>
<Import module for RabbitMQ>

//Gather all the Environment variables from VCAP
<Import module to read VCAP environment variables>

//Retrieve the URLs for MongoDB and RabbitMQ
var mongoUrl = cf_svc.get_mongo_url();
var rabbitUrl = cf_svc.get_rabbit_url();

//Import the schema to store reviews
<Import the model of review to be stored in MongoDB>

//Import the service to send out tweets
<Import the service which will send reviews to Twitter>

// Set Express app parameters
app.set('port', process.env.PORT || 6000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
//app.use(app.router);
app.use(statics(path.join(__dirname, 'public')));

// development only debug 
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*POSTGRESQL*/

// Connection string for PostgreSQL - **Needs to be replaced**
// Example : var conString = "postgres://rOo4g-PLjh_2r_Vc:zTgaaUZYu291t3dr@10.11.241.4:45266/k9MAD9ezQmj031uj";
var conString = "<to-be-replaced>";

// Connect to PostgreSQL
var client = new pg.Client(conString);
client.connect(function(err) {
	if(err) {
		return console.error('could not connect to postgres', err);
	}
});

/* ---------------------Data Loading----------------------------- */

// Cleanup table if it exists
client.query("DROP TABLE IF EXISTS restaurants");
client.query("CREATE TABLE IF NOT EXISTS restaurants(rest_id serial primary key, rest_name varchar(100), cuisine varchar(30), location varchar(30) not null, num_reviews integer, rating real)");

// Insert list of restaurants to Postgres
client.query("INSERT INTO restaurants(rest_name, cuisine, location, num_reviews, rating) values($1, $2, $3, $4, $5)", ['Kuteera', 'South Indian', 'Jayanagar', 0, 0.0]);
client.query("INSERT INTO restaurants(rest_name, cuisine, location, num_reviews, rating) values($1, $2, $3, $4, $5)", ['Chowmein', 'Chinese', 'Koramangala', 0, 0.0]);
client.query("INSERT INTO restaurants(rest_name, cuisine, location, num_reviews, rating) values($1, $2, $3, $4, $5)", ['Chettinad', 'Andhra', 'Indiranagar', 0, 0.0]);
client.query("INSERT INTO restaurants(rest_name, cuisine, location, num_reviews, rating) values($1, $2, $3, $4, $5)", ['Bella', 'Italian', 'Brigade Road', 0, 0.0]);
client.query("INSERT INTO restaurants(rest_name, cuisine, location, num_reviews, rating) values($1, $2, $3, $4, $5)", ['Tandoor', 'Middle Eastern', 'Rajajinagar', 0, 0.0]);

/*MONGODB*/

// Connect to MongoDB
mongoose.connect(mongoUrl);

mongoose.connection.on("open", function(ref) {
	console.log("Connected to mongo server.");
	return console.log(mongoUrl);
});

mongoose.connection.on("error", function(err) {
	console.log("Could not connect to mongo server!");
	return console.log(err);
});

// Cleanup review collection if it exists
reviews.remove({}, function(err) { 
	console.log('collection removed'); 
});

// Navigation to add a new review
app.get("/hotels/new", function (req, res) {
  res.render("new", {title: 'The Foodie App', name: req.query.name, locality: req.query.locality});
});

//Save the newly created review
app.post("/hotels", function (req, res) {
  var name=req.body.name;
  var loc=req.body.locality;
  var user=req.body.username;
  var email=req.body.email;
  var review=req.body.feedback;
  var rating=req.body.ratinginput;
  
  /*RABBITMQ*/
  
  // Connect to RabbitMQ
  amqp.connect(rabbitUrl, function(err, connect) {
	  
	  // Create a channel
	  connect.createChannel(function(err, channel) {
 			var queue = 'reviews';
 			var message = user +' just reviewed restaurant '+ name;
 			
 			// Check if queue exists
 			channel.assertQueue(queue, {durable: false});
 			
 			// Push the message to the queue
 			channel.sendToQueue(queue, new Buffer(message));
 			console.log(" [x] Sent %s", message);
	  });
	setTimeout(function() {connect.close();}, 500); // Wait
	
	// Call the service to read from the queue and post to Twitter
	tweet.posttweet();
  });
  
  // Get id of the selected restaurant
  client.query('SELECT rest_id FROM restaurants WHERE (rest_name = $1 AND location = $2)',[name,loc], function(err, result1) {
  	    if (err) {
  	      return console.error('error running query', err);
  	    }
  	    
  	    var id = JSON.stringify(result1.rows[0].rest_id);
  	    
  	    // Get the current number of reviews
  	  	client.query('SELECT num_reviews FROM restaurants WHERE rest_id = $1',[id], function(err, result2) {
  	  	    if (err) {
  	  	      return console.error('error running query', err);
  	  	    }
  	  	    
  	  	    var revnum = JSON.stringify(result2.rows[0].num_reviews);
  	  	    
  	  	    // Add to review number
  	  	    revnum = Number(revnum) + 1;
  	  	    
  	  	    // Calculate the new rating
  	  	    reviews.find({restaurantName:name}, function(err,revs){
  	  	    	var rate;
  	  	    	if (revs.length !== 0){
  	  	    		
  	  	    		var totalrating = 0;
  	  	    		
  	  	    		for (var i=0; i < revs.length; i++){
  	  	    			
  	  	    			totalrating = totalrating + Number(revs[i].rating); 
  	  	    			
  	  	    		}
  	  	    		
  	  	    		rate = ((totalrating+Number(rating))/revnum).toFixed(2);
  	  	    		
  	  	    	} else {
  	  	    		
  	  	    		rate = rating;
  	  	    		
  	  	    	}
  	  	    	
  	  	    	// Update the new rating and new review number into PostgreSQL
  	  	    	client.query('UPDATE restaurants SET num_reviews = $1, rating = $2 WHERE rest_id = $3',[revnum, rate, id], function(err, result3) {
  	    	  		if (err) {
  	    	  	   		return console.error('error running query', err);
  	    	  	   	}

  	    	  		// Create a new record in the review collection
  	    	  	   	reviews.create({restaurantName: name, userName: user, userEmail: email, review: review, rating: rating}, function(err, details){
  	    	  	   		if (err) {  	    	  	   			
  	    	  	   			return console.error('error updating collection', err);
  	    	  	   		}
  	    	  	   		res.redirect('/');
  	    	  	   	});
    	  	    });
  	  	    });
  	  	}); 
  });

});

// Create and run the express server 
http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
});

// App home page showing list of restaurants
app.get('/', function(req, res){
  client.query('SELECT * FROM restaurants ORDER BY rest_id', function(err, docs) { 
    res.render('hotels', {hotels: docs, title: 'The Foodie App'});
  });
});

// Navigation to view all reviews for a restaurant
app.get("/hotels/reviews", function (req, res) {
	reviews.find({restaurantName:req.query.name}, function(err,revs){
		res.render("reviews", {title: 'The Foodie App', name: req.query.name, reviews: revs });    
    });
});
