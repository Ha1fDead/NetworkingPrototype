# Networking Prototype

This prototype was built to teach me about Game Networking. Specifically:

1. WebSockets. How to use them, make them, spin up / spin down, etc.
2. First-ever forray into Network Collision (i.e. someone edits something when someone else deletes that thing)
3. Http2

I think that I largely succeeeded with the prototype. This is more academic than anything actually useful.

## Project Notes

(I decided to leave these in here so you could see into my workflow a little)

Prototype Functionality Goals:

- On a failed load, will retry
- Will retry to send messages that fail
- Properly implements "paging"
- Multiple users can send messages simultaneously
- On connect, receive "Hydration" message list
- load cached messages from the client

Goal:

- Use websockets to enable real-time communication with minimal latency
- Introduce a persistent "Data Access Layer" that bubbles up to the Application / UI code
- Have three separate ways to "Load Data": App Hydrate, User Change, Network Change
- Be able to handle change collisions (users do two things that conflict)
- Support online and offline interactions, update online environment when network is achieved
- Minimize network utilization for a target "2G" or "3G" experience
- Pseudo-database replication
- Learn how to stress test a networked app
- Learn how to write automated scripts that prevent leaking sensitive data (Server scripts, obfuscation, etc.)
- Test WebWorkers with performance and networking implications
- Test RxJS, Websockets, and WebWorkers
- Determine how database is synced from network requests
- Determine where and how "Background Game Logic" is implemented and synchronized
- Determine rate limiting

The actual fully-fledge game implementation:

- maintain ongoing game state connections for an arbitrary number of games
- sync users game states
- handle messaging / video contexts
- sync game state to database
- fire backups appropriately
- fire AI scripts

## Network Protocol

- Use WebSockets to communicate Api data from Client <-> Server
- Use Http requests to load static, cacheable, resources

Need to implement a `NetworkManager` which handles all Networking. The current intent is to use a single WebSocket for all data communication (instead of many sockets).

The NetworkManager should handle...

1. Serializing and Deserializing data to and from the server
2. Notfying resources of network updates to data or a failure to update the data
3. Handles offline temporary storage of data to be sent when network access is re-achieved

Since WebSockets are basically a glorified TCP connection, the application must define its own Networked protocol. It should handle...

1. Reporting success or failure of a web request
2. Bundling the "Send" and "Retrieve" of a "Transaction"
3. Contain an arbitrary amount of data

Envisioning a base "Networking Service" that handles ALL communication with the server

- "Subscribe" to specific data streams, notified on updates
- "Unsubscribe" when you don't care
- "SendData" takes in a "Serializable" so the JSON.stringify works correctly and implementation can be swapped out easily for better performance
- "ReceiveData" would map to a specific data format, and call that "DeSerialize"

```javascript
OnReceiveData(data) {
  let dataFormat = getFormat(data);
  let dataSerializer = getSerializer(dataFormat)
  let typedObject = dataSerializer.DeSerialize(data);
  
  let subscriptions = getSubscriptions(dataFormat);
  foreach(sub of subscriptions) {
    subscriptions.notify(typedObject);
  }
}
```

## Networking User Behavior

1. Users should be notified if they will lose any data by closing the tab, page, browser, or reloading anything. This should be rare and resolved immediately where data is stored temporarily.
2. Users should be notified if they are making changes or viewing their data in "Offline Mode" (without meaningful internet access)
3. The users should expect the networking AND application code to work 100% of the time
4. The application should "Fail" Gracefully from server or network errors
5. When the user closes a tab, where temporary data is detected, they are warned of the volatility of browser memory and that changes can be lost, and to sync network access ASAP.
6. When the user performs an action that is no longer valid due to networking constraints, the action should fail without notifying the user. An example, you are looting the corpse of a Goblin and the GM deletes the Goblin token. The loot window should disappear and the prior "loot" action should re-synchronize your inventory since it failed
7. When an action fails, the user should not receive a generic error saying "Please Try Again". The system should fail accordingly and crash.

## Networking Technical Behavior

1. The network should be able to support X users, Y bandwidth
2. User actions should never fail
3. User connections should fail (from the Server) if no connection is received within a timeout threshold
4. User agents should automatically try to reconnect to the server

## Networking Technical Unknowns

- What happens when a connection is saturated with too much data?
- What is my limit for users + bandwidth?
- What is my timeout threshold?

## Network Conflict Resolution

Example Incompatible Actions:

1. Player deletes a pawn the same time a separate player moves it
2. Two players alter the terrain simultaneously
3. Two players alter a name of a pawn simultaneously
4. Two players alter a description of an object simultaneously

(For incompatible actions, imagine someone doing these things at the literal same moment in time, OR one player is in Offline mode making these changes and syncing them up minutes/hours/days later)

Resolution Strategies:

1. Three-way merge (git, text merge, etc.)
2. Accept "Last Input" always (potential to lose data)
3. Notify someone who sends a conflict that there is a conflict, and their data will be lost
4. Offer a resolution merge strategy "Take theirs" and "Take mine", moving #2 and #3 to the user

Resolution strategies can differ depending on the type of data:

1. "Primitive" data (bool, number, character, selected option) would always take "Last Input"
2. Strings can be merged using a three-way merge
3. binary / blob data is where it gets REALLY confusing

For the MVP of Network Resolution Strategies, always take in "Full Data" and not "Partial Data". E.g., users altering a text document will send the full text instead of partial text. This can eventually be improved to send snippets of data w/ offsets to minimize networking bandwidth, while still getting me moving forward.

## Inspiration

[mdn example github](https://github.com/mdn/samples-server/tree/master/s/websocket-chat)

[actual mdn tutorial for above link](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
