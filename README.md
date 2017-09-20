# IOT_Server
IOT_Server project

This is a general purpose IOT server, that takes JSON input data. The server takes two types of methods POST webhooks, and Get requests.

Each of these methods has different event types that are declared within the JSON format. Below is a table listing all event types avaliable:

|eventType|Method|Function|
|----|---|----|
|connect|POST|generates and returns deviceID|
|update|POST|Updates the server with sensor information|
|test|POST|For sending test signals confirming connection|
|pull|POST|For retrieving sensor data files|

ALL devices must send JSON in the following format, but not all postions need to be populated:

{
  deviceID: (Only needed after intially connecting, is the reference to the server)
  time: (the time that the message is sent)
  event: {
    eventType: (this is one of the eventTypes in the above table)

1. Connecting Devices

  In order to intially connect a device and obtain a deviceID, a 
