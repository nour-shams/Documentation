# Make The Database Actually do Something

We have a database always doing the same thing. We want to replace this with a "Controller".  
A Controller is going to simplify the access to the database.

You may ask, why do we have a controller in there? Why isn't express directly acting on the database?

Quickly, 3 reasons:

1. What if we wanted to access the database from  outside Express? Maybe through the command line, or maybe through another method of communication
2. You want to simplify the SQL, reduce it to the part you need, and expose just that. It makes understanding what each function does much easier
3. What if you wanted some day to throw SQLite and use MongoDB instead? No problem. Keep everything as it is, just change the internals of the controller

Instead of the Javascript above, replace `db.js` with the following:

```js
// back/src/db.js
import sqlite from 'sqlite'
import SQL from 'sql-template-strings';

const initializeDatabase = async () => {

  const db = await sqlite.open('./db.sqlite');
  
  /**
   * retrieves the contacts from the database
   */
  const getContactsList = async () => {
    let returnString = ""
    const rows = await db.all("SELECT contact_id AS id, name, email FROM contacts")
    rows.forEach( ({ id, name, email }) => returnString+=`[id:${id}] - ${name} - ${email}` )
    return returnString
  }
  
  const controller = {
    getContactsList
  }

  return controller
}

export default initializeDatabase
```

and `index.js` with:

```js
// back/src/index.js
import app from './app'
import initializeDatabase from './db'

const start = async () => {
  const controller = await initializeDatabase()
  const contacts_list = await controller.getContactsList()
  console.log(contacts_list)
  //app.get('/',(req,res)=>res.send("ok"));
  //app.listen(8080, ()=>console.log('server listening on port 8080'))
}

start();
```

We temporarily comment out the express part, because we just want to test our database.

We want for our database to finish initializing before we pursue, so we'd want to use `await` here.

Run the project (`npm start`), you should see a list of people.