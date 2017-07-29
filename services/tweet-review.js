/**
 * http://usejsdoc.org/
 */

exports.posttweet = function(){
	
        // Import dependencies	
		var amqp = require('amqplib/callback_api');// Module for RabbitMQ
		var Twitter = require('twit');// Module for Twitter
		var config = require('../config/config');
		var Twit = new Twitter(config);
		
		// Get RabbitMQ URL from environment variables VCAP
		var cf_svc = require( '../app/vcap_services');
		var rabbitUrl = cf_svc.get_rabbit_url();

		/*RABBITMQ*/
		  
		// Connect to RabbitMQ
		amqp.connect(rabbitUrl, function(err, connect) {
			
	      // Create a channel
		  connect.createChannel(function(err, channel) {
		    var queue = 'reviews';
		    
		    // Check if queue exists
		    channel.assertQueue(queue, {durable: false});
		    console.log(" [*] Waiting for messages in %s.", queue);
		    
		    // Consume the message from the queue
		    channel.consume(queue, function(message) {
		      console.log(" [x] Received %s", message.content.toString());
		      var tweet = {status: message.content.toString() }; 
		      
		      // Post the message to twitter
		      Twit.post('statuses/update', tweet, tweeted);
		      function tweeted(err, data, response) {
		    	  if(err){
		    		  console.log("Something went wrong!");
		    		  console.log(err);
		    		  connect.close();
		    	  }
		    	  else{
		    		  console.log("Just tweeted!");
		    		  connect.close();
		    	  }
		      }
		    }, {noAck: true});
		  });
		});
	return "Done";
};


