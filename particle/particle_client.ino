
#include <ArduinoJson.h>
TCPClient client;

// char method[] = '';
// char path[] = '';
// char version[] = '';
// char host[] = '';
// char cotentLength[] = '';
// char contentType[] = '';
// char messagebody[] = '';

byte server[] = {192,168,1,101}; //My Computer

//Create JSON Data
DynamicJsonBuffer<200> messageBuffer;
JsonObject& root = messageBuffer.createObject();
root["test"] = "test";
root[time] = 123456;

JsonArray& data = root.createNestedArray("data");
data.add(123);
data.add(456);







int len = strlen(root); //Holds the length of the string in bytes



void setup(){

  Serial.begin(9600);
  // Serial.print("Host: ");
  // Serial.println(host);
  // Serial.print("Method: ");
  // Serial.println(method);
  // Serial.print("Path: ");
  // Serial.println(path);


  if (client.connect(server, 8000))
  {
    Serial.println("connected");
    client.println("POST * HTTP/1.0");
    client.println("host: 192.168.1.101");
    client.print("content-Length: ");
    client.println(len);
    client.println("content-type: text/plain");
    client.print("\r\n");
    client.print(root);
    client.flush();

  }
  else
  {
    Serial.println("connection failed");
  }
  // while(Serial.available()==false){
  //   Serial.println("Waiting for input");
  // }
}

void loop()
{
  if (client.available())
  {
    char c = client.read();
    Serial.print(c);
  }

  if (!client.connected())
  {
    Serial.println();
    Serial.println("disconnecting.");
    client.stop();
    for(;;);
  }
}
