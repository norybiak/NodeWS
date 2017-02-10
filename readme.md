#NodeWS
This project is a small websocket server with client code. I built this to be used with my MIDI Piano app, so Server.js contains specific code for that, however, it can be used for anything that requires simple websocket.

Client.js is used on the client side and doesn't require node or any library.

Server.js is used with node.

##usage

###Client:

Connecting to the server:
 ``` javascript
 
Server.connect({host: '[host]'}, function() 
{
  //This is your initial call to the server 
  Server.send('newUser', {username: user.displayName, ID: user.userId });
});	
 ```
 
Registering client events:
 ``` javascript
 
 //These don't have to be in the connect callback. Can be anywhere, even before the connection is made.
Server.on('[eventName]', function(data) { runEventResponse(data); });
 ```
 
Server:
 
 This has a little bit more work to be done as it's not generic...it contains specific code for the Piano app.
 
