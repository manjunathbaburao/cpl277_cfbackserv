// app-bound services environment variables
module.exports = {

  // Get MongoDB URL from VCAP
  get_mongo_url: function () {
    if (process.env.VCAP_SERVICES) {
      var svc_info = JSON.parse(process.env.VCAP_SERVICES);
      for (var label in svc_info) {
        var svcs = svc_info['mongodb'];
        for (var index in svcs) {
          var url = svcs[index].credentials.uri;
          return url;
        }
      }
    }
  },
  
//Get RabbitMQ URL from VCAP
  get_rabbit_url: function () {
	    if (process.env.VCAP_SERVICES) {
	      var svc_info = JSON.parse(process.env.VCAP_SERVICES);
	      for (var label in svc_info) {
	        var svcs = svc_info['rabbitmq'];
	        for (var index in svcs) {
	          var url = svcs[index].credentials.uri;
	          return url;
	     }
	  }
	}
  }
};
