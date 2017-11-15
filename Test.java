private AmazonS3 getS3Client(){
	AWSCredentials credentials = new BasicAWSCredentials(accessKeyId, secretAccessKey);
	AmazonS3 s3client = null;
	if(proxyEnabled){
		logger.info("Using proxy");
		ClientConfiguration config = new ClientConfiguration();
		config.setProxyDomain("proxy.wdf.sap.corp");
		config.setProxyPort(8080);
		s3client = new AmazonS3Client(credentials, config);
	}else{
		logger.info("Not using proxy");
		s3client = new AmazonS3Client(credentials);
	}
		s3client.setEndpoint(awsS3Endpoint);
		return  s3client;
  }
  
  public String uploadObject(@PathVariable("bucket_name") String bucketName,
  HttpServletRequest request, HttpServletResponse response){
      	String objectName = "object"+count; 
    	
    	AmazonS3 s3client = getS3Client();
    	ClassLoader classLoader = this.getClass().getClassLoader();
    	File file  = new File(classLoader.getResource("application.properties").getFile());
    	s3client.putObject(new PutObjectRequest(
                bucketName, objectName, file));
    	count++;
    	return "successfully created object "+objectName;
		
  }
  
  public void downloadObject(@PathVariable("bucket_name") String bucketName,@PathVariable("object_name") String objectName,
  HttpServletRequest request, HttpServletResponse response) throws IOException{
    	
    	AmazonS3 s3client = getS3Client();
    	S3Object seObject = s3client.getObject(new GetObjectRequest(bucketName, objectName));
    	ObjectMetadata objectMetadata = seObject.getObjectMetadata();
    	
    	ObjectMapper mapper = new ObjectMapper();
    	
    	response.addHeader("metadata", mapper.writeValueAsString(objectMetadata));
    	org.apache.commons.io.IOUtils.copy(seObject.getObjectContent(), response.getOutputStream());
    	
  }
