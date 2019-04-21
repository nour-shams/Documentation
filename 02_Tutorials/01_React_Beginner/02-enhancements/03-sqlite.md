# Add the Database


We are going to need a database on the back-end. Some good databases include MariaDB, PostgresSQL, MongoDB, CouchDB, and so on, but they all need external dependencies. For the purpose of this exercise, we want the app to be entirely made of Javascript, so it runs exactly the same on all systems (Windows/OSX/Linux), without having to install anything external.

We could go for [NeDB](https://github.com/louischatriot/nedb) or [TingoDB] (http://www.tingodb.com/) which both work almost similarly to MongoDB, or [PouchDB](https://pouchdb.com/) which is like CouchDB, or [Loki](https://github.com/techfort/LokiJS). All of these work anywhere (browser, node, etc). There are also decentralized databases like [Gun](https://gun.eco/) or [Orbit](https://github.com/orbitdb/orbit-db), which are very interesting, but too different from what's used in a regular application. Since this is a didactic exercise, we want to go with something a bit more classical.

So, we'll settle for SQLite. We'll use the [Node-SQLite](https://github.com/kriasoft/node-sqlite) driver for Node. We're also installing [sql-template-strings](https://www.npmjs.com/package/sql-template-strings), which will help us write SQL queries in Javascript, and is compatible with this `node-sqlite`. Move to the `back` directory.

```sh
npm install sqlite sql-template-strings --save
```

**note** if you get a Node-Gyp error while installing SQLite, it may be your Node version. Try downgrading Node (possibly with [nvm](https://github.com/creationix/nvm)).

Then, let's create a file `db.js`, in which we will store our database connection. We will also add some code to create a basic "contacts" table

```js
// back/src/db.js
import sqlite from 'sqlite'
import SQL from 'sql-template-strings';

const test = async () => {

  const db = await sqlite.open('./db.sqlite');
  /**
   * Create the table
   **/ 
  await db.run(`CREATE TABLE contacts (contact_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email text NOT NULL UNIQUE);`);

  /**
   * let's insert a bit of data in it. We're going to insert 10 users
   * We first create a "statement"
   **/
  const stmt = await db.prepare(SQL`INSERT INTO contacts (name, email) VALUES (?, ?)`);
  let i = 0;
  while(i<10){
    await stmt.run(`person ${i}`,`person${i}@server.com`);
    i++
  }
  /** finally, we close the statement **/
  await stmt.finalize();

  /**
   * Then, let's read this data and display it to make sure everything works
   **/
  const rows = await db.all("SELECT contact_id AS id, name, email FROM contacts")
  rows.forEach( ({ id, name, email }) => console.log(`[id:${id}] - ${name} - ${email}`) )
}

export default { test }
```

You will notice the usage of `async` and `await`. Those are used in asynchronous functions. `async` indicates to the javascript compiler that the function will contain asynchronous code. `await` tells the compiler to pause while an asynchronous function executes.

**note**: You can *only* use `await` inside an `async` function. Thus, using `await` at root level will not work.

Let's import this in `index.js`. Add on top of the file:

```js
// back/src/index.js
...
import db from './db'
...
db.test()
```

Then run the app (with `npm start`). The database commands should run, and two things happen:

1. a file `db.sqlite` gets created
2. you see some output in your console

If everything works, great!  
Edit the file `.gitignore` at the root, and add `**/*.sqlite` to hide generated database files. We don't want those checked into Git.

**note**: if you run the file a second time, you will get an error saying the table already exists; This is because we didn't put any check to make sure the table exists first. It doesn't matter, because we're going to remove the test anyway.

If everything works, we can remove the test from `index.js`.