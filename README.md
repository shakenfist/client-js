# shakenfist-client

A {type,java}script client for interacting with Shaken Fist.

## Usage

Currently we export 2 clients

1. The "raw" client, which more or less directly maps to the Shaken
Fist REST API.

2. The regular client, which actually has entities with methods

```typescript
import { Client } from 'shakenfist-client';
// Or using require
// const { Client } = require('shakenfist-client');

// Connect to a Shaken Fist instance
const client = new Client('http://sf-1:13000', 'my-secret-key', 'some-namespace');

async function examples() {
  // list all nodes
  const nodes = await client.listNodes();

  // list all instances
  const instances = await client.listInstances();

  // get a specific instance
  const someInstance = await client.getInstance('0d5a1249-9cd2-4dd9-9850-64aae13d926f');

  // turn it off
  await someInstance.stop();

  // list the events that have happened to it
  const events = await someInstance.getEvents();
  console.log(events);
  // or
  await someInstance.getEvents();
  console.log(someInstance.events);
}
```

## Limitations

For now, all that's supported is listing instances, as well as
starting/stopping/pausing them etc.

