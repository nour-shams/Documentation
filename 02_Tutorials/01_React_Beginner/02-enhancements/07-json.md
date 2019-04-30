# Using JSON

This is all good and well, but how would we know which part of the string is the `name`, and which the `email`? How would we be able to count those contacts?

We could, for example, split the string at specific intervals, parse the part before and after the "-", and so on. It would be a lengthy, and difficult, exercise.

**Or**, we could use a known and used data format called "json". Let's do that.

In order to do that, we need to change three things:

1. the controller should return a javascript object (and not a string)
2. `express` should send json
3. `fetch` should read the json
4. `React` should display the data (rather than just a string)

Let's tackle those in order:

```js
// back/src/db.js
// change:
  const getContactsList = async () => {
    let returnString = ""
    const rows = await db.all("SELECT contact_id AS id, name, email FROM contacts")
    rows.forEach( ({ id, name, email }) => returnString+=`[id:${id}] - ${name} - ${email}` )
    return returnString
  }
// to:
  const getContactsList = async () => {
    const rows = await db.all("SELECT contact_id AS id, name, email FROM contacts")
    return rows
  }
```

```js
// back/src/index.js
// change:
res.send(contacts_list)
// to:
res.json(contacts_list)
```

**note**: this is not needed. Express is smart enough to transform automatically data to json and send that. But we specify `json` instead of `send` for clarity.

You can go to your React app running on `localhost:3000`, and refresh. You will see that you are now receiving a json structure.

Let's loop over this array. Edit `App.js`

```js
// front/src/App.js
// since we will receive an array of people, and not a string, we need to
// change:
state = { contacts_list:"" }
// to:
state = { contacts_list:[] }

// AND

// We also need fetch to read the json, so
// change:
const text = await response.text()
this.setState({contacts_list:text})
// to:
const data = await response.json()
this.setState({contacts_list:data})

// AND:

// finally, we want to loop over the contacts, and display them individually, so
// change:
<Text style={styles.text}>{contacts_list}</Text> / <p>{contact_list}</p>
// to:
// if using react-native-web:
{ contacts_list.map( contact => 
      <View key={contact.id}>
        <Text>{contact.id} -  {contact.name}</Text>
      </View>
  )
}
// if using regular css:
{ contacts_list.map( contact => 
      <div key={contact.id}>
        <p>{contact.id} -  {contact.name}</p>
      </div>
  )
}
```

Check your app, you now have a list of names. Fantastic!

Last thing to do: error control. What if the url is wrong? What if the server is down? We need to make sure we catch errors.

## Error Control

To catch errors, we use the very common `try`...`catch` pattern:

```js
try{
  // some javascript that can explode
}catch(error){
  // do something with the error, for example:
  console.log(error.message)
}
```

In this case, we'll do:

```js
class App extends Component {
  state = { contacts_list:[] }
...
  async componentDidMount(){
    try{
      const response = await fetch('//localhost:8080/contacts/list')
      const data = await response.json()
      this.setState({contacts_list:data})
    }catch(err){
      console.log(err)
    }
  }
...
```

If you change the url for something that doesn't exist, you will see an error in your console. Later, we'll have better error handlers, but for now, this is enough for a skeleton.
