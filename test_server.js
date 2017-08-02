/*
  Server for SPH project v1 6/2/2017
  Boston University
  Kenwood Harris Jr.
  
  ****WARNING THIS FILE IS NO LONGER IN USE****
 		 DEPRECATED
*/

const http = require('http'); // import http
const fs = require('fs'); //import File system

//Holds the values for the accepted method, path, header, and authorization types
//auth is the
const servername = 'testServer';
console.log("Server Name: " + servername);
console.log(getDateTime());

/*
    The methods taken should have different responses. The POST method will be
    The methods taken should have different responses. The POST method will be
    a webhook request and response. GET command is reserved for future access
    from a locally connected device, and CONNECT is used to initialize the deive
    again using webhooks.
*/

//Options variable holds the path files to the key and certificate
//Requires certificate and rejects if certificate is not found
//Agent handler goes here if Request Control is wanted

//global header and body variables
var postbodyrequirements = ['deviceID', 'time', 'event', 'deviceType', 'sensorTypes', 'sensorData', 'group', 'location', 'file']; //array with the strings of the required JSON body entries
var connectbodyrequirements = ['time', 'event', 'deviceType', 'sensorTypes', 'group', 'location'];
var getbodyrequirements = ['deviceID', 'time', 'event', 'deviceType', 'sensorTypes','group', 'location', 'file'];

//time
function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}

//Holds the number of devices
var IDnum = 0;

//---------------------------------------------------------------------------------------------------------------------------------------------
//Creates http server object with the parameters of options
//When a request is handled the function is called
const testServer = http.createServer(function(req,res){

  var clearbody = false;
  var method = req.method;
  var body = '';

  console.log("Method: " + method);


  req.on('data',function(chunk){body += chunk; console.log(chunk)});
  req.on('end', function(){
    body = body.toString();
    body = JSON.stringify(body);
    body = JSON.parse(body);
    console.log(body);
  });

  console.log("BODY: " + body);

  //If the method is not supported
  if(method != 'POST' || 'CONNECT' || 'GET'){
    res.writeHead(400,"REQUEST method is not supported");
    res.end();
    }

while(req.on('end'))
  //For a POST method
  if (method == 'POST'){
    if (true){ //uses JSON searcher to only accept valid body
      res.writeHead(400, "JSON body POST requirements were not met.");
      res.end();
    }else{
      clearbody = true;   //states body requirements have been met
      console.log("Body meets POST requirements.");
      console.log("Values:\n" + body.deviceID + " " + body.time + " "+ body.event + " " + body.deviceType + " " + body.sensorTypes + " " + body.sensorData);
    }
    if (clearbody == true){ //if the header and body meet the requirements
      sendMessage(); // MAIN Function that determines what message is sent back must accept header and body, and req.method variables
    }
  }

  //For a CONNECT method
  if (method == 'CONNECT') {
    if (false){
      res.writeHead(400,"JSON body CONNECT requirements were not met.");
      res.end();
    }else{
      clearbody = true;
      console.log("Body meets CONNECT requirements");
    }

    if (clearbody == true){
      sendMessage();
    }
  }

    //For a GET method
    if (method == 'GET'){
      if (false){
        res.writeHead(400,"JSON body GET requirements were not met.");
        res.end();
      }else{
        clearbody = true;
        console.log("Body meets GET requirements");
      }

      if (clearbody == true){
        sendMessage();
      }
    }
//-----------------------------------------------------------------------------------------
//function that searches for required values in JSON data
  function jsonSearcher(data,requirement){
    var validStructure;
    var i;
    for (i=0; i < requirement.length; i++){
      if (data[requirement[i]] == null){
        console.log("Checking value: " + data[requirement[i]]);
        validStructure = false;
        break;
      } else{
        validStructure = true;
      }
    return validStructure;
    }
  }


//--------------------------------------------------------------------------------------------------
//function to handle the stream of data from req.on
  function chunk(value){
    body = value + body;
  }
//-------------------------------------------------------------------------------------------------------
//function that prints out the concatenated data from the data stream
  function bodyPrint(){
    body.toString();
    body = JSON.parse(body);
    console.log('Request body:\n' + body);
  }

//----------------------------------------------------------------------------------------------------------------------------------------------
//Function that handles the message being sent. Becasue of scope it is placed inside of testServer.
  function sendMessage(){
    var responseMessage;
    var responseEndMessage;
    var responseHeaders;
    //INSERT the logic to determine what to send most likely will turn into a class, this will be the largest function
    if(method == 'POST'){
      //various functtions and events can happen here that return can give values to send back to the client
      responseMessage = postResponseMessage(); //Returns the respones Message
      responseEndMessage = postResponseEndMessage(); //Returns the end message
      responseHeaders = postResponseHeaders(); //Returns the response headers in a json format
      res.writeHead(200,"OK",responseheaders);
      res.write(responseMessage);
      res.end(responseEndMessage);
    }

    if(method == 'CONNECT'){
      //Same as in POST, function calls go here
      responseMessage = connectResponseMessage();
      responseEndMessage = connectResponseEndMessage();
      responseHeaders = connectResponseHeaders();
      res.writeHead(200,"OK",responseheaders);
      res.write(responseMessage);
      res.end(responseEndMessage);
    }

    if(method == 'GET'){
      //Same as in CONNECT and POST, function calls go here
      responseMessage = getResponseMessage();
      responseEndMessage = getResponseEndeMessage();
      responseHeaders = getResponseHeaders();
      res.writeHead(200,"OK",responseheaders);
      res.write(responseMessage);
      res.end(responseEndMessage);
    }
  }
//-------------------------------------------------------------------------------------------------------------------------------------------------
//Functions to determine the response to the clients

  function createDeviceID(){ //Creates Device ID
    IDnum = IDnum + 1;  //increases the device counter
    var IDnumstr = IDnum.toString();
    IDalpha = body.deviceType;
    return IDalpha + IDnumstr;  //returns a new and unique device ID
  }

  if (method == "POST" || "GET"){
    var deviceID = body.deviceID; // Assigns device ID if connect method is
  } else {
    var deviceID = createDeviceID();
  }

  //_________________________POST_____________________________________________________
  function postResponseMessage(){
    console.log("POST from: " + deviceID);
    var mes = {}; //holds the message
    var postLog = "postlog.txt";

    if(body.event == "update" || "reset"){
      var v;
      for(v=0; v< body.sensorTypes.length; v++) {
        var wd = deviceID.toString() + body.sensorTypes[v]; //stores the working directory
        var sensorpost = body.sensorData[a].toString() + "," + getDateTime().toString();//the log of the infor
        var postInfo = deviceID.toString() + "," + body.sensorTypes[a] + "," + body.event + getDateTime().toString();

        fs.open(postLog, 'a', function(err,fd){
          if(err){
            console.log("Error opening sensor file");
          } else {
            console.log("Opening Sensor File");
          }
          fs.write(fd, postInfo, function(err){
            if(err){
              console.log("Error wrting to Sensor File");
            }else {
              console.log("Writing to Sensor File...");
            }
            fs.close(function(err){
              if(err){
                console.log("Error Closing File");
              } else {
                console.log("Sensor File Closed");
              }
            });
          });
        });

        if(body.event == "update"){
          fs.open(wd, 'a', function(err,fd){
            if(err){
              console.log("Error opening sensor file");
            } else {
              console.log("Opening Sensor File");
            }
            fs.write(fd,sensorpost, function(err){
              if(err){
                console.log("Error wrting to Sensor File");
              }else {
                console.log("Writing to Sensor File...");
              }
              fs.close(function(err){
                if(err){
                  console.log("Error Closing File");
                } else {
                  console.log("Sensor File Closed");
                }
              });
            });
          });
        }
        if(body.event == "reset"){
          fs.open(wd, 'w', function(err,fd){
            if(err){
              console.log("Error opening sensor file");
            } else {
              console.log("Opening Sensor File");
            }
            fs.write(fd, body.sensorData[a], function(err){
              if(err){
                console.log("Error wrting to Sensor File");
              }else {
                console.log("Writing to Sensor File...");
              }
              fs.close(function(err){
                if(err){
                  console.log("Error Closing File");
                } else {
                  console.log("Sensor File Closed");
                }
              });
            });
          });
        }

      }
      mes.targetID = deviceID;
      mes.time = getDateTime().toString();
      mes.event = body.event + "responsemessage";
      mes.successful = true;
      mes.group = body.group;
    }
    if(body.originalRequest.source == "google"){
      //handle google webhook here
    }
    if(body.event == "settings"){
      //have settings set here, next time client connects settings are updated
    }
    return mes;
  }
  function postResponseEndMessage(){
    return "";
  }
  function postResponseHeaders(){
    return {"content-type":"application/json", "date": getDateTime().toString(), "host": "Test-Server"};
  }

  //_________________________CONNECT__________________________________________________

  function connectResponseMessage(){
    console.log("New Connect Request.......");

    var mes = {};
    var connectlog = "connectlog.txt"
    var connectInfo = deviceID.toString() + "," + body.group + "," + body.deviceType+ "," + getDateTime().toString() + "\n";
    //logs Connect request
    fs.open(connectlog, 'w', function(err,fd){ //opens file will overwrite if file already exists
      if(err == true){
        console.log("Error Creating file");
      }else{
        console.log("Log file opened...");
        openlog = true;
      }
      fs.write(fd, connectInfo , function(err){
        if (err){
          console.log("Error writing to file");
        } else {
          console.log("Connection Logged");
          writelog = true;
        }
        fs.close(fd,function(err){
          if(err){
            console.log("Error closing file");
          } else {
            console.log("File closed");
            closelog = true;
          }
        });
      });
    });

    //Creates a Sensor File for every sensor on device
    var a;
    for (a=0; a < body.sensorTypes.length; a++){
      //Create Sensor File
      var sensorfile = deviceID.toString() + body.sensorTypes[a];

      fs.open(sensorfile, 'a', function(err,fd){
        if (err){
          console.log("Error creating File");
        }else {
          console.log("Sensor File Created...");
        }
        fs.write(fd,sensorConnectInfo, function(err){
          if(err){
            console.log("Error Writing to file");
          }else {
            console.log("Writing to File");
          }
          fs.close(fd, function(err){
            if(err){
              console.log("Error closing File");
            }else{
              console.log("File Closed");
            }
          });
        });
      });
    }

    mes.targetID = deviceID;
    mes.time = getDateTime().toString();
    mes.event = "connectresponse";
    mes.successful = true;
    mes.group = body.group;
    return mes;
}


  function connectResponseEndMessage(){
    return "";
  }

  function connectResponseHeaders(){
    return {"content-type":"application/json", "date": getDateTime().toString(), "host": "Test-Server"};
  }

  //________________________GET_______________________________________________________

  function getResponseMessage(){
  console.log("GET request from: "+ deviceID);
  var want = body.event;

  if(want == "export"){
    var file = body.file;
  }

  if(want == "pull"){

  }


  return mes;
  }

  function getResponseEndeMessage(h,b){
	return "";
  }

  function getResponseHeaders(h,b){
    return {"content-type": "application/json", "date": getDateTime.toString(), "host":"Test-Server"};
  }

//----------------------------------------------------------------------------------
});

testServer.listen(8000); //initializes the server with all the above parameters
