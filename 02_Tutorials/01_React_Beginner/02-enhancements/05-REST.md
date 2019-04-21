# Make Express Query the Controller

Last part, let's make Express answer with a list of people.


```js
// back/src/index.js
import app from './app'
import initializeDatabase from './db'

const start = async () => {
  const controller = await initializeDatabase()
  app.get('/', (req, res) => res.send("ok"));

  app.get('/contacts/list', async (req, res) => {
    const contacts_list = await controller.getContactsList()
    res.send(contacts_list)
  })
  
  app.listen(8080, () => console.log('server listening on port 8080'))
}
start();
```

We now have two routes in our express app. `/` leads to "ok", and `/contacts/list` gives us a list of contacts.

Run the app, and try it; navigate to http://localhost:8080/contacts/list, and verify you see a list of people

Great! Moving on to linkage with the front-end now. We're almost done with our setup

## PART II - Step 7: Access the Back-End from the Front-End

Let's go back to our front end. We need to be able to access this data.

In a first instance, let's keep it simple. We're simply going to query the back-end, and log the answer

Move into `front/src`, open `index.js`, and write in it, anywhere:

```js
// front/src/App.js
...

fetch('//localhost:8080/contacts/list')
  .then( response => response.text() )
  .then( text => console.log("we got a response!!",text))

...
```

run the root `npm start`, to start the back and front. Go to http://localhost:3000, and check the console. You should see the contacts in your log. Ok great!

Let's use that in React now. Remove the lines above, we don't need them anymore