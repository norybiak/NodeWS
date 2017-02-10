var WebSocketServer = require('ws').Server;
var events = require('events');
var eventEmitter = new events.EventEmitter();
var uniqueid = require('uniqueid')
var user = uniqueid('user');
var readline = require('readline');

var users = {};
var moderators = ['350379511960830299'];

var playing = false;
var songs = 12;
var song = 0;
var startTime = 0;
var globalPlay = true;

var wss = new WebSocketServer({ port: 8080 });
wss.on('connection', function (ws) 
{
	var userId = user();

	users[userId] = { username: "", altID: -9999, color: "", isModerator: false, client: ws};
	
	ws.on('message', function (packet) 
	{
		parseReceived(userId, JSON.parse(packet));
	});

	ws.on('close', function () 
	{
		console.log(users[userId].username + " disconnected.");
		delete users[userId];
	});
});

function parseReceived(userId, packet)
{
	var event = packet.event;
	var data = packet.data;

	eventEmitter.emit(event, userId, data);
}

function createPacket(eventName, data)
{
	var data = (data !== undefined) ? data : false;
	var packet;
	
	if (data !== false)
	{
		packet = JSON.stringify( {event: eventName, data: data} );
	}
	else
	{
		packet = JSON.stringify( {event: eventName} );
	}
	
	return packet;
}

function broadcast(eventName, data, exclude) 
{
	var exclude = exclude || false;
	var packet = createPacket(eventName, data); 

	for (var user in users)
	{
		if (!exclude) //includes all users
		{
			users[user].client.send(packet, function(error) {});
		}
		else if (exclude == 'moderators') //exclude moderators
		{
			if (!users[user].isModerator)
			{
				users[user].client.send(packet, function(error) {});
			}
		} 
		else if (exclude != user) //exclude the user
		{
			users[user].client.send(packet, function(error) {});
		}
	}
}

eventEmitter.on('newUser', function (userId, data)
{
	//Add the initiating user to the users object
	users[userId].username = data.username;
	
	if (data.altID)
	{
		users[userId].altID = data.altID;
		
		for (var i = 0; i < moderators.length; i++)
		{
			if (moderators[i] == data.altID)
			{
				users[userId].isModerator = true;
			}
		}
	}
	
	var packet = createPacket('next', song); 
	users[userId].client.send(packet, function(error) {});
	
	eventEmitter.emit('console', userId, {command: 'allowed', value: globalPlay });

	console.log(users[userId].username + " has joined!");
});

eventEmitter.on('newUserColor', function (userId, data)
{
	//Add the initiating user to the users object
	users[userId].color = data;
});

eventEmitter.on('noteOn', function (userId, data)
{
	data.color = users[userId].color;
	broadcast('noteOn', data, userId);
});

eventEmitter.on('noteOff', function (userId, data) { broadcast('noteOff', data, userId); });
eventEmitter.on('start', function (userId, data){ broadcast('start', data); });
eventEmitter.on('stop', function (userId, data){ broadcast('stop', data); });

eventEmitter.on('next', function (userId, data)
{
	if (song >= (songs-1))
	{
		song = 0;
	}
	else
	{
		song++;
	}
	
	broadcast('next', song);
});

function handleCommand(s)
{
	var command = s[0];
	var arg = s[1];
	switch (command)
	{
		case '/stop':
			eventEmitter.emit('stop', 'console');
			break;
			
		case '/global':
		
			var allowed;
			if (arg == 'off')
			{
				allowed = 0;
				globalPlay = false;
			}
			else if (arg == 'on')
			{
				allowed = 1;
				globalPlay = true;
			}

			eventEmitter.emit('console', 'console', {command: 'allowed', value: allowed });
			break;
			
		case '/allow':
		
			var user = getUserByUsername(arg);
			eventEmitter.emit('console', user, {command: 'allowed', value: 1 });
			break;
			
		case '/disallow':
			
			var user = getUserByUsername(arg);
			eventEmitter.emit('console', user, {command: 'allowed', value: 0 });
			break;
			
		default:
			console.log('Not a valid command');
	}
}

eventEmitter.on('console', function (userId, data)
{ 
	if (userId == 'console')
	{
		broadcast('console', data, 'moderators'); 
	}
	else
	{
		var packet = createPacket('console', data); 
		users[userId].client.send(packet, function(error) {});	
	}
});

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', function(line)
{
	var s = line.split(' ');
	
	handleCommand(s);
})

function getUserByUsername(username)
{
	for (var user in users)
	{
		if (users[user].username == username)
		{
			return user
		}
	}
}