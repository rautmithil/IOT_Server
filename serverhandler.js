/*
Sensor Server V3
Mithil Kishor Raut, Kenwood Harris Jr
Boston University MCL Oct 2017

Papaparse Library Used, thanks to mholt @github, found at www.papaparse.com.

*/

/*
  The following are mandatory files in the root path:
  postlog.csv
  connectlog.csv
  getlog.csv
  settings.csv
  IDlog.csv
  info.csv
  IDtrack.csv
  sensorMaster.csv


*/

const http = require('http'); //node http module
const net = require('net'); //node net module
var ip = require('ip');
const fs = require('fs'); //node file system module
const url = require('url'); //node url module
//const Papa = require('papaparse'); //papaparse module for CSV<===>JSON

const postbodyrequirements = ['deviceID', 'time', 'event', 'deviceType', 'sensorTypes', 'sensorData', 'group', 'location', 'file'];
const getbodyrequirements = ['time', 'event', 'deviceType', 'sensorTypes', 'group', 'location'];
const connectbodyrequirements = ['deviceID', 'time', 'event', 'deviceType', 'sensorTypes','group', 'location', 'file'];
var approvedIP = ['192.168.1.101','127.0.0.1'];

const serverSettingsFile = 'serversettings.csv';//holds the current settings for the server
const lightBoxSettings = 'lightboxsettings.csv';//holds the current settings for the lightboxes
const postlog = 'postlog.csv'; //logs all post requests
const getlog = 'getlog.csv'; //logs all get requests 
const pulllog = 'pulllog.csv'; //logs all the pull requests
const resetlog = 'resetlog.csv'; //logs all the reset requests
const IDtrack = 'IDtrack.csv'; //initialized with zero if file does not exist
const IDlog = 'IDlog.csv'; //logs all the generated ID's
const infofile = 'info.csv'; //logs info of the server
const sensorMaster = 'sensorMaster.csv'; //holds a record of the created sensor files
const onStartUp = ['serverSettingsFile','lightBoxSettings','postlog','getlog','IDtrack','IDlog','infofile']; //Required system files
const logFiles = [postlog,getlog,pulllog,IDtrack,IDlog,sensorMaster]

//Checks system settings, and ensures necessary files are included in respective directory
function systemTest(){}


//Assigns device ID takes one parameter, the devicetype
function assignDeviceID(deviceID){
  //Handles IDtrack
  if(fs.existsSync(IDtrack)){
    var idNum = fs.readFileSync(IDtrack); //reads the tracker file contents
  }else{ //if IDtrack does not exist
    fdit = fs.openSync(IDtrack,'wx');
    fs.writeSync(fdit,deviceID);
    fs.closeSync(fdit);
  }
  id = deviceID;  //Generates device ID
  console.log("ID is: " + deviceID);
  //idNum = parseInt(idNum);
  //numAppend = idNum + 1;    //Increments device ID replaces it into the file
  //numAppend = numAppend.toString();
  fs.writeFileSync(IDtrack,deviceID,null);

  //Handles IDlog
  if(fs.existsSync(IDlog)){ //Checks to see if the file has been created.
    idLogBuf = Buffer.from(fs.readFileSync(IDlog)); //Creates new buffer of the id log
    idLogBuf = Buffer.from(idLogBuf + deviceID + "," + getDateTime() + "\r\n");
    fs.writeFileSync(IDlog ,idLogBuf,null); //Writes appended buffer
  }else{//if the file does not exist the file is created with the necessary headers.
    fdil = fs.openSync(IDlog,'wx');
    fs.writeSync(fdil,"DeviceID,Time\r\n" + deviceID + "," + getDateTime() + "\r\n");
    fs.closeSync(fdil);
  }
  //Generated ID is returned
  return deviceID;
}

//Function for obtaining the date and time
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

    var time = (year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec).toString();
    return time;
}

function getDate() {
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

    var time = (year + "_" + month + "_" + day).toString();
    return time;
}

//Function that ensures all fields are included
function jsonSearcher(values,a){
  var present = true;
  for(i=0;i<values.length;i++){
    var curval = values[i];
    if(a.hasOwnProperty(curval) == false){
      present = false;
      console.log("Check failed at value: " + curval);
      break;
    }
  }
  if(present){
    console.log("Meets JSON requirements");
  }
  return present;
}

function postmessage(b,ip){
  //Create empty message object
  var mes = {};
  var poststatus = "Successful";

  //Log the postmessage
  var postinfo = b.deviceID + "," + ip + ","+ getDateTime() + "\r\n"; //if this is a connect event device ID is init
  if(fs.existsSync(postlog)){ //Checks to see if the post log exists
    postLogBuffer = Buffer.from(fs.readFileSync(postlog,null));
    postLogBuffer = Buffer.from(postLogBuffer + postinfo);
    fs.writeFileSync(postlog,postLogBuffer,null);
  }else{
    fdpl = fs.openSync(postlog,'wx');
    fs.writeSync(fdpl,"DeviceID,IP,Time\r\n" + b.deviceID + "," + ip + "," + getDateTime() + "\r\n"); //header and post log data
    fs.closeSync(fdpl);
  }
  

  //POST Event handler
  switch (b.event.eventType) {
    case 'connect':
  //Logs the files to the master file
  //Creates sensor files
      newId = assignDeviceID(b.deviceID); //holds the newly generated ID
      var sensorNum = b.sensorTypes.length; //holds the number of sensors on the device
      var h;
      //Loops to create the necessary sensor files
      for(h=0;h<sensorNum;h++){
        sensorfile = newId + b.sensorTypes[h] + getDate() + ".csv";
        if (fs.existsSync(sensorfile)){ //checks to see if the file already exists
          console.log("File " + sensorfile + " already exists ");
        }
        else{
        fs.writeFileSync(sensorfile,"Value,Recorded_Time,Recieved_Time\r\n",null); //creates empty sensor file with value and time header    
        }
        
        if(fs.existsSync(sensorMaster)){//Checks to see if sensorMaster file exists
          masterBuffer = Buffer.from(fs.readFileSync(sensorMaster,null)); //Saves current masterFile to buffer
          masterBuffer = Buffer.from(masterBuffer + sensorfile + "," + getDateTime() + "\r\n"); //appends to the buffer
          fs.writeFileSync(sensorMaster,masterBuffer,null);//writes buffer
        } else{
          fd = fs.openSync(sensorMaster,'wx');
          fs.writeSync(fd,"Filename,Time\r\n" + sensorfile + "," +getDateTime() + "\r\n");
          fs.closeSync(fd);
        }
       
      }

      //Message Response
      mes = {
        'deviceID': 'ServerOG',
        'time':getDateTime(),
        'event':{
          'eventType': 'connectResponse',
          'parameters': []
        },
        'deviceType':'Server',
        'response': id,
        'status':poststatus
      }
     break; 
    //---------------------------------------------------------------------------
    case 'update':
    /*
      Arrays MUST update the device and device values at the same index

    */
      var v;
      for(v=0; v< b.sensorTypes.length; v++) {
          //console.log("length: " + Object.keys(b.sensorData).length);
          for(w = 0; w< b.sensorData.length; w++){
            var wd = b.deviceID.toString() + b.sensorTypes[v] + ".csv"; //stores the working directory
            var sensorpost = b.sensorData[w].toString() + "," + b.time + "," + getDateTime().toString() + "\r\n";//the log of the information
            //console.log("sp: " + sensorpost);
            console.log("Updating File: " + wd);
            fdup = fs.openSync(wd,'a');
            fs.writeSync(fdup,sensorpost);
            fs.closeSync(fdup);
        }
      }
      mes = {
        'deviceID': 'ServerOG',
        'time':getDateTime(),
        'event':{
          'eventType': 'updateResponse',
          'parameters': []
        },
        'deviceType':'Server',
        'response': null,
        'status':poststatus
      }
      break;
      //----------------------------------------------------------------------------------------------------


    case 'reset':
      /* If the reset request is sent from an individual device then only that device's file is reset. Only a computer or non-device client can reset device groups or full server
          Reset Types: reset(Resets the device that sends the request), sensorReset(Resets all the sensor files of a sensor type), deviceReset(reset all of the same device type),
          fullReset(Can only be initiated by approved ip addresses) 
      */
      console.log("Reset request from: " + ip);

      try {
        var resetType = b.event.parameters[0];
      } catch (error) {
        console.log("Error reset parameter not given");
        
       resetErr = {
      'deviceID': 'ServerOG',
        'time':getDateTime(),
        'event':{
          'eventType': 'resetResponse',
          'parameters': {

          }
        },
        'deviceType':'Server',
        'response': 'JsonErr'
      }
        return JSON.stringify(resetErr);
      }

      //Logs reset request
      var resetinfo = b.deviceID + "," + ip + "," + b.event.parameters[0] + "," + getDateTime()+"\r\n";
      if(fs.existsSync(resetlog)){ //Checks to see if the reset log exists
        resetLogBuffer = Buffer.from(fs.readFileSync(resetlog,null));
        resetLogBuffer = Buffer.from(resetLogBuffer + resetinfo);
        fs.writeFileSync(resetlog,resetLogBuffer,null);
      } else{
        fdrl = fs.openSync(resetlog,'wx');
        fs.writeSync(fdrl,"DeviceID,IP,ResetType,Time\r\n" + b.deviceID + "," + ip + "," + b.event.parameters[0] + "," + getDateTime() + "\r\n"); //header and reset log data
        fs.closeSync(fdrl);
      }

      //Checks the ip authority
      var ipCheck = false;
      if(b.event.parameters[0] == 'fullReset' || 'deviceReset' || 'sensorReset'){
        var iplen = approvedIP.length;
        var p;
        for(p=0;p<iplen;p++){
          if(ip == approvedIP[p]){
            ipCheck = true;
          }
        }
      }else if (b.eventType.parameters[0] == 'reset') {
        ipCheck = true;
      } else {
        console.log("Unvalid Reset type given");
      }
      
      //Handles reset type
      if(ipCheck == true){
        var senpres = true; //holds bool for sensormaster presence
        console.log("Reset authorized: " + ip + " " +b.event.parameters[0]);

        //Handles full Reset: Resets all logs and device ID's to zero
        if(b.event.parameters[0] == 'fullReset'){
          var date = new Date();
          //Creates a file with the the date and resetBackup name
          bufdir = 'resetBackup' + "_" +date.getMonth().toString() + "_" + date.getDate().toString() + "_" + date.getHours().toString()+ "_" + date.getMinutes().toString()+ "_"+ date.getSeconds().toString();
          console.log("Creating new folder: " + bufdir);
          fs.mkdirSync(bufdir); //makes a directory for file backups
          try { //if the sensor master file does not exist ensures error is handled
            sensorMasterBuffer = Buffer.from(fs.readFileSync(sensorMaster)); //saves the sensorMaster file to a buffer to remove
          } catch (error) {
            console.log("sensorMaster file does not exist, reset will proceed")
            senpres = false;
          }
          var loglen = logFiles.length;
          var l;
          for(l=0;l<loglen;l++){
            if(fs.existsSync(logFiles[l])){
              console.log("Copying file: " + logFiles[l]);
              holbuf = Buffer.from(fs.readFileSync(logFiles[l])); //Makes a buffer from the log file at l
              //console.log("Copied File: " + holbuf);
              fdhf = fs.openSync("./" + bufdir + "/" + logFiles[l],'w'); //creates a backup file
              fs.writeSync(fdhf,holbuf.toString()); //writes to the backup
              console.log("Writing Backup File: " + logFiles[l] + "...");
              fs.closeSync(fdhf);//closes the backup
              fs.unlinkSync(logFiles[l],0); //deletes file
              console.log("Erasing File: " + logFiles[l] + "...");
              holbuf = Buffer.from(""); //empties the buffer
            }else{
              console.log("Log file: " + logFiles[l] + " does not exist in this directory or has not been created");
            }
            
          }
          //removes all the sensor files
          if(senpres == true){
            var returnFiles = [];
            var sensorMasterIterate = sensorMasterBuffer.toString();
            var sensorMasterSplit = sensorMasterIterate.split('\r\n');
            var i;
            //loop to collect files
            for(i=0;i<sensorMasterSplit.length;i++){ //loops through split values
               var c;
               for(c=0;c<sensorMasterSplit[i].length;c++){//loops through string
                if(sensorMasterSplit[i][c] == ',' && i > 0){  //if the value is a comma and not the header
                  curval = returnFiles.length;//holds the current value for appending
                  returnFiles[curval] = sensorMasterSplit[i].substring(0,c);//adds the filename
                }
              }
            }
          console.log("Sensor Files to erase: " + returnFiles);
          console.log("Total files to erase: " + returnFiles.length);
          //loop to backup files and then delete the files from file list
            var j;
            for(j=0;j<returnFiles.length;j++){
              var tempbuff = Buffer.from(fs.readFileSync(returnFiles[j]));
              console.log("Saving Backup: " + returnFiles[j]);
              fdsb = fs.openSync("./" + bufdir + "/" + returnFiles[j],'wx');
              fs.writeSync(fdsb,tempbuff.toString());
              fs.closeSync(fdsb);
              fs.unlinkSync(returnFiles[j]);
              console.log("Removing file: " + returnFiles[j]);
            }
        }
      }
        //Handles individual device file reset
        if(b.event.parameters[0] == 'reset'){
          resetlen  = b.sensorTypes.length;
          var e;
          for(e=0;e<resetlen;e++){
            var rd = b.deviceID.toString() + b.sensorTypes[e] + ".csv"; //stores the reset directory
            fs.truncateSync(rd,0); //truncates sensorfile 
          }
           
        }

        //Successful return message
        mes = {
          'deviceID': 'ServerOG',
          'time':getDateTime(),
          'event':{
            'eventType': 'updateResponse',
            'parameters': []
          },
          'deviceType':'Server',
          'response': 'RESET',
          'status':'Succesful'
        }
        
      }else{
        console.log("Reset Request not Authorized");
        mes = {
          'deviceID': 'ServerOG',
          'time':getDateTime(),
          'event':{
            'eventType': 'updateResponse',
            'parameters': []
          },
          'deviceType':'Server',
          'response': 'AutErr',
          'status':'Rejected'
        }
      }
      break;
      //-----------------------------------------------------------------------------------------------------

    case 'test':
      mes = {
        'deviceID': 'ServerOG',
        'time':getDateTime(),
        'event':{
          'eventType': 'updateResponse',
          'parameters': []
        },
        'deviceType':'Server',
        'response': null,
        'status': 'Successful'
      }
      
      JSON.stringify(mes);
      break;
      
    case 'pull':
      //initialize response buffer
      var responseBuffer = Buffer.alloc();
      //log pull info
      var paramlen = b.event.parameters.length;
      var u;
      for(u=0;u<paramlen;u++){
        //updates pulllog
        var pullinfo = b.deviceID + "," + ip + "," + b.event.parameters[u] + "," + getDateTime()+ "\r\n";
        if(fs.existsSync(pulllog)){
          pullLogBuffer = Buffer.from(fs.readFileSync(pulllog,null));
          pullLogBuffer = Buffer.from(pullLogBuffer + pullinfo);
          fs.writeFileSync(pulllog,pullLogBuffer,null);
        }else{
          fdpol = fs.openSync(pulllog,'wx');
          fs.writeSync(fdpol,"DeviceID,IP,Info,Time\r\n" + b.deviceID + "," + ip + "," + b.event.parameters[u] + "," + getDateTime() + "\r\n");
        }
        //pulls wanted information into buffer
        //creates response buffer made of previous information
        //files are seperated by /r/n
        responseBuffer = Buffer.from(responseBuffer + fs.readFileSync(b.deviceID + b.event.parameters[u] +".csv") + "\r\n"); 
      }
      mes = {
        'deviceID': 'ServerOG',
        'time':getDateTime(),
        'event':{
          'eventType': 'pullResponse',
          'parameters': []
        },
        'deviceType':'Server',
        'response': responseBuffer.toString(),
        'status':"Successful"
      }
      break;
      //----------------------------------------------------------------------
    default:
    mes = {
      'deviceID': 'ServerOG',
        'time':getDateTime(),
        'event':{
          'eventType': 'POSTResponse',
          'parameters': []
        },
        'deviceType':'Server',
        'response': 'Successful'
      }
      break;
  }
    return JSON.stringify(mes);
}

//Event handler that determines the response back, formatted in JSON

function getmessage(path,ip,b){
  //log the get request
  var getinfo = b.deviceID + "," + ip + ","+ path +"," + getDateTime() + "\r\n"; 
  if(fs.existsSync(getlog)){ //if the get log does not exist
    getLogBuffer = Buffer.from(fs.readFileSync(getlog,null));
    getLogBuffer = Buffer.from(getLogBuffer + getinfo);
    fs.writeFileSync(getlog,getLogBuffer,null);
  }else{
    fdgl = fs.openSync(getlog,'wx');
    fs.writeSync(fdgl,"DeviceID,IP,Path,Time\r\n" + b.deviceID + "," + ip + b.method + "," + getDateTime() + "\r\n"); //header and post log data
    fs.closeSync(fdgl);
  }

  console.log("GET Path requested: " + path);

  mes = {
        'deviceID': 'ServerOG',
        'time':getDateTime(),
        'event':{
          'eventType': 'getResponse',
          'parameters': []
        },
        'deviceType':'Server',
        'response': "test",
        'status':"Successful"
      }


  return JSON.stringify(mes);
}

  

//Checks that the Server file, and setting requirements are met before starting the server
//systemTest();

//Server Object Handles the function calls request distrubution
var testserver = http.createServer(function(req,res){
  console.log("---------------------------------------------------------------");

  var reqip = req.connection.remoteAddress;   //obtains the Ip address of the request
  console.log("Request from: " + reqip);

  var requrl = req.url;                       //obtains url
  console.log("URL: " + requrl);

  var method = req.method;                   //obtains the method type
  console.log('METHOD: ' + method);

  var headersJson = req.headers;            //header handling
  var headersString = JSON.stringify(req.headers);
  console.log('HEADERS: ' + headersString);

  //body handling and applicable message response
  var body = '';
  req.on('data',function(chunk){
     body = body + chunk;
  });
  req.on('end',function(){
    console.log("BODY: " + body);

    if(method == "POST"){
      //Try block to parse the string into a JSON object
      try{
        body = JSON.parse(body, 'utf8');
      } catch (err){
          console.log("Request from " + reqip + " does not have correct JSON format" + err);
          var jsonerr = {
            'deviceID': 'ServerOG',
            'time':getDateTime(),
            'event':{
              'eventType': 'errorMessage',
              'parameters': [],
            },
            'deviceType':'Server',
            'response': 'JsonErr'
      }
      res.writeHead(400, "Data not in JSON format");
      res.write(JSON.stringify(jsonerr));
      res.end();
      console.log("Error Response sent");
    }
      if(jsonSearcher(postbodyrequirements,body)){
        res.writeHead(200,"OK");
        res.write(postmessage(body,reqip))
        res.end();
        console.log("Response Sent");
      }else{
        console.log("Failed to meet json requirements");
        res.writeHead(400,"JSON requirements not met");
        res.end();
      }
    }

    if(method == "GET"){
      res.writeHead(200,"OK");
      res.write(getmessage(requrl,reqip,body));
      res.end();
    }


    if(method != "POST" || "GET"){
      res.writeHead(400,"Method not supported");
      res.end();
    }

  });
});

var port = 8000;
var host = ip.address();
//var host = 'localhost';
var backlog = 511;


testserver.listen(port,host,backlog,function(err){
  if(err){
    console.log("Error opening server occured");
  } else{
    console.log("Initializing server");
    console.log("Server Info: " + JSON.stringify(testserver.address()));
  }
});



/*--------------------------------------------------------------GRAVEYARD----------------------------------------------------

try {
      param = b.event.parameters;
    } catch (error) {
      console.log("Parameters are not set");
      paramMes = {
        'deviceID': 'ServerOG',
        'time':getDateTime(),
        'event':{
          'eventType': 'connectResponse',
          'parameters': []
        },
        'deviceType':'Server',
        'response': "Parameters not set",
        'status':"Error"
      }
      return paramMes;
    }

  switch (b.event.eventType) {
    
  
    default:
      break;
  }



          for(m=0;m<smblen;m++){
            //Checks to see if the values a
            if((sensorMasterIterate[m] + sensorMasterIterate[m+1] + sensorMasterIterate[m+2] + sensorMasterIterate[m+3]) || 
              sensorMasterIterate[m-1] + sensorMasterIterate[m] + sensorMasterIterate[m+1] + sensorMasterIterate[m+2] ||
              sensorMasterIterate[m-2] + sensorMasterIterate[m-1] + sensorMasterIterate[m] + sensorMasterIterate[m+1] ||
              sensorMasterIterate[m-3] + sensorMasterIterate[m-2]+ sensorMasterIterate[m-1]+ sensorMasterIterate[m] == '/r/n'){

                sensorReset = sensorReset + sensorMasterIterate[m]; //append the current value to the reset value
            }else{
              sensorReset = '';

            }
          }



                      var resetFiles = []; //holds the list of files to remove
            var sensorMasterIterate = sensorMasterBuffer.toString(); //Holds the iteratable string
            console.log("SensorMaster File: " + sensorMasterIterate);
            var sensorMasterSplit = sensorMasterIterate.split('\r\n');  //splits the string by carrige return
            var ri;
            for(ri=0;ri<sensorMasterSplit.length;ri++){   //loops through the split lines
              var rc;
              for(rc=0;rc<sensorMasterSplit[ri].length;rc++){  //loops through each string at sensorMasterSplit[ri]
                if(sensorMasterSplit[ri][rc] == "," && ri > 0){ //if the value at sensorMasterSplit[ri][rc] is a comma
                  var resetpos = resetFiles.length; //stores the position to append to the reset file list
                  resetFiles[resetpos] = sensorMasterSplit[i].substring(0,rc);
                  //appends to the reset list the values from the begining of the string to the comma.
                }
              }
            }
          console.log("Files to reset: " + resetFiles);

*/
