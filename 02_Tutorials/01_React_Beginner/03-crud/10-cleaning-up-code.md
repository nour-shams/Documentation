# Cleaning Up Code

This is going to be a long and painful session to read through. It won't have a lot of structure, what we will do is take a bunch of repeated code, and abstract it so we don't have to see it in our face all the time.

So, here comes just a bunch of chapters without any specific order.


### Error Handling in `back/db.js`

Currently, our `db.js` file has this structure:

```
method1
  try
    call SQL
  catch
    send error message

method2
  try
    call SQL
  catch
    send error message

method3
  try
    call SQL
  catch
    send error message

method4
  ...etc
```

How about, instead, we do:

```
callSQMethod
  try
    call SQL
  catch
    send error message

method1
  callSQLMethod

method2
  callSQLMethod

method3
  callSQLMethod

method4
  ...etc  
```

Let's look at a those few methods and study what is the common part between them.

It seems the common part is as follows:

```js
  const anyMethod = async props => {
    (-- UNIQUE CODE --)
    try {
      const result = await db.(-- METHOD: `run`, `all`, or `get` --)(
        (-- UNIQUE QUERY --)
      );
      (-- UNIQUE CODE --)
    } catch (e) {
      throw new Error((-- UNIQUE MESSAGE --) + e.message);
    }
  };
```

The `unique code` parts, we can't pass them to the function. However, we can pass the rest of the things.

Our function would, then, take three arguments, and return a result

```js
// back/src/db.js
...
const initializeDatabase = async () => {
  const db = await sqlite.open("./db.sqlite");
  ...
  const databaseCall = async ( method, query, error_message ) => {
    try {
      if(method === 'run'){
        const result = await db.run(query);
        return result.stmt;
      }
      if(method === 'all'){
        return await db.all(query)
      }
      if(method === 'get'){
        return await db.get(query)
      }
    } catch (e) {
        throw new Error(error_message+`: ` + e.message);
    }
  }
  ...
```

Another part we can extract is this:

```js
    if (!props || !props.name || !props.email || !props.author_id) {
      throw new Error(`you must provide a name, an email, and an author_id`);
    }
```

Let's make a generic function that checks we have the proper parameters. The function itself will be more complex, but when used, it will be clearer. Here's the function:

```js
// back/src/db.js
/**
 * Makes sure all the properties passed to the function exist on the object
 * Throws an error if any property is missing.
 * For example:
 * 
 * ```js
 * const obj = { a:1, b:2 }
 * ensurePropertiesExist(obj,['a','c'])
 * ```
 * In the example above, the function will throw `property "c" is necessary`,
 * 
 * If no errors are thrown, then the object, untouched, is returned
 * @param {Object} obj an object to check
 * @param {Array} names an array of property names
 * @returns {Object} the object itself
 */
const ensurePropertiesExist = (obj, names) => {
  if(!obj){ 
    throw new Error(`the properties `+names.join(',')+' are necessary')
  }
  for(let i=0; i < names.length; i++){
    const propertyName = names[i]
    if(obj[propertyName] === null || typeof obj[propertyName] === 'undefined' ){
      throw new Error(`property "${propertyName}" is necessary`)
    }
  }
  return obj
}
```

If we use those two functions, we can change `createContact` to the below:

```js
const createContact = async props => {
  const { name, email, author_id, image } = ensurePropertiesExist(props,['name','email','author_id'])
  const date = nowForSQLite();
  const query = SQL`INSERT INTO contacts (name,email, date, image, author_id) VALUES (${name}, ${email}, ${date}, ${image}, ${author_id})`
  const statement = await databaseCall('run',query, `[C] failed to insert this contact`)
  return statement.lastID
};
```

Compare with the previous method. None of the **functionality** of `createContact` has changed, however, it is much easier to *read*. Each line expressed its intent in a much clearer manner than before.

Here are the rest of the methods:

```js
// back/src/db.js
  ...

  const deleteContact = async props => {
    const { contact_id, author_id } = ensurePropertiesExist(props,['contact_id','author_id'])
    const query = SQL`DELETE FROM contacts WHERE contact_id = ${contact_id} AND author_id = ${author_id}`
    const statement = await databaseCall('run',query, `[D] failed to delete this contact`)
    return statement.changes
  };

  ...
  
  const updateContact = async (props) => {
    ensurePropertiesExist(props,['contact_id'])
    const previousProps = await getContact(props)
    const newProps = {...previousProps, ...props }
    ensurePropertiesExist(newProps,['name','email','author_id'])
    const query = SQL`UPDATE contacts SET `
      .append(
        joinSQLStatementKeys(
          ["name", "email", "image"],
          newProps,
          ", "
        )
      )
      .append(SQL` WHERE `)
      .append(
        joinSQLStatementKeys(
          ["contact_id", "author_id"],
          newProps,
          " AND "
        )
      );
    const statement = await databaseCall('run',query, `[U] failed to update this contact`)
    return statement.changes;
  };

  ...
  /**
   * ...
   * @param {Object} props an object with the id of the contact
   * ...
   */
  const getContact = async props => {
    const { contact_id } = ensurePropertiesExist(props,['contact_id'])
    const query = SQL`SELECT contact_id AS id, name, email, image, author_id FROM contacts WHERE contact_id = ${contact_id}`
    return await databaseCall('get',query,`[R] could not get the contact ${contact_id}`)
  };

  ...
  
  const getContactsList = async props => {
    ...
    const query = SQL`SELECT contact_id AS id, name, email, date, image, author_id FROM contacts WHERE ${orderProperty} > ${startingId}`;
    ...
    query.append(SQL` LIMIT ${limit || 100}`);
    return await databaseCall('all',query,`couldn't retrieve contacts`)
  };

  ...

  const createUserIfNotExists = async props => {
    const { auth0_sub, nickname } = props;
    const query  = SQL`SELECT user_id FROM users WHERE auth0_sub = ${auth0_sub}`
    const answer = await databaseCall('get',query)
    if (!answer) {
      await createUser(props);
      return { ...props, firstTime: true };
    }
    return props;
  };

  ...

  const createUser = async props => {
    const { auth0_sub, nickname } = ensurePropertiesExist(props,['auth0_sub','nickname'])
    const query = SQL`INSERT INTO users (auth0_sub, nickname) VALUES (${auth0_sub},${nickname});`
    const statement = await databaseCall('run', query, `couldn't create the user`)
    return statement.lastID;
  };
```

There are few notable changes:

- previously, we called the database queries sometimes `query`, and sometimes `statement`. We consolidated that. Everything we send is a `query`. `statement` is what gets returned from `db.run`.
- Similarly, we've replaced variables called `id` by `contact_id`, which is clearer.
- previously, when a user failed to get deleted, an error was thrown. Now, we just return `false`. This is a change in **functionality**, not just style, but it's worth the consistency.
- Most importantly, we had methods with two arguments, and methods with one. For example, why is `updateContact` using two arguments (`contact_id` and `props`) instead of just `props` like every other? There is no good reason, and so, we made all methods use one argument, props. Of course, this means we need to change how we call the methods in our controller. We'll do that below.

As a result, our code is much easier to read and to parse.

### Cleaning up `back/src/index.js`

Let's do the same thing we were doing before. Let's observe most methods. They can all be summed to:

```js
app.post("(-- CUSTOM URL --)", (-- CUSTOM MIDDLEWARE --) ,async (req, res, next) => {
  (-- CUSTOM CODE --)
  try {
    (-- CUSTOM CODE --)
    const result = await controller.(-- CUSTOM METHOD --)
    res.json({ success: true, result });
  } catch (e) {
    next(e);
  }
});
```

This translates to the following function:

```js
  const controllerCall = async (method, props, res, next) => {
    try{
      const result = await controller[method](props);
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  }
```

We'll use it like so:

```js
  app.post("/contacts/new", isLoggedIn, upload.single('image'), async (req, res, next) => {
    const author_id = req.user.sub
    const { name, email } = req.query;
    const image = req.file && req.file.filename
    controllerCall('createContact',{ name, email, image, author_id },res,next)
  });
  
  // READ
  app.get("/contacts/get/:contact_id", async (req, res, next) => {
    const { contact_id } = req.params;
    controllerCall('getContact',{ contact_id },res,next)
  });
  
  // DELETE
  app.get("/contacts/delete/:contact_id", isLoggedIn, async (req, res, next) => {
    const author_id = req.user.sub
    const { contact_id } = req.params;
    controllerCall('deleteContact',{ contact_id, author_id },res,next)
  });
  
  // UPDATE
  app.post("/contacts/update/:contact_id", isLoggedIn, upload.single('image'), async (req, res, next) => {
    const author_id = req.user.sub
    const { contact_id } = req.params;
    const { name, email } = req.query;
    const image = req.file && req.file.filename
    controllerCall('updateContact',{ contact_id, name, email, author_id, image },res,next)
  });
  
  // LIST
  app.get("/contacts/list", async (req, res, next) => {
    const { order, desc, limit, start } = req.query;
    controllerCall('getContactsList',{order, desc, limit, start},res,next)
  });
```

Again, we cleaned up without changing any functionality.

We'll also move the uploading code in a separate file so we don't have to read it everytime we open `index.js`. Create a new file, `back/src/upload.js`:

```js
// back/src/upload.js
import path from 'path'
import multer from 'multer' 

const multerStorage = multer.diskStorage({
  destination: path.join( __dirname, '../public/images'),
  filename: (req, file, cb) => {
    const { fieldname, originalname } = file
    const date = Date.now()
    // filename will be: image-1345923023436343-filename.png
    const filename = `${fieldname}-${date}-${originalname}` 
    cb(null, filename)
  }
})

const upload = multer({ storage: multerStorage  })

export default upload
```

In `index.js`:

```js
// back/src/index.js
...
import upload from './upload'
```

### Using Axios

We've concocted our own helpers for `fetch`, but actually, there is much better to do. We can use [Axios](https://github.com/axios/axios), which already does all the things we've written functions for.

Let's install it. Move to the `front`, and do:

```sh
npm install --save axios
```

Import it:

```js
// front/src/App.js
import axios from 'axios'
```

Then we could simply exchange `fetch('/blah')` to `axios.get('/blah')` and `fetch('/blah',{method:'POST'})` to `axios.post('/blah')`, but we'll just do a little better. We don't need the `makeRequestURL` method, because Axios already allows us to pass parameters as an object.

We know the common part of all the request functions:

```js
try {
  this.setState({ isLoading: true });
  // we'll use axios instead of fetch, but the logic stays the same
  const response = await fetch((-- PATH --), (-- DATA --))
  const answer = await response.json()
  if (answer.success) {
    this.setState({ isLoading: false });
  } else {
    this.setState({ error_message: answer.message, isLoading: false });
    toast.error('client error:'+answer.message);
  }
  (-- DO SOMETHING WITH answer.result --)
} catch (err) {
  this.setState({ error_message: err.message, isLoading: false });
  toast.error('server error: '+err.message);
}
```

We'll replace `makeURL`, `makeRequestURL`, and `ObjectToQuery`. Remove them from `App.js` and `utils.js`

Instead, in `App.js`, inside the `App` class, write the following function:

```js
// front/src/App.js
...
class App extends Component {
  ...
  request = async (path, data) => {
    try {
      this.setState({ isLoading: true });
      const response = await axios({
        method: "get",
        url: `//localhost:8080/${path}`,
        headers: { Authorization: `Bearer ${auth0Client.getIdToken()}` },
        ...data
      });
      const answer = response.data
      if (answer.success) {
        this.setState({ isLoading: false });  
      } else {
        this.setState({ error_message: answer.message, isLoading: false });
        toast.error('client error:'+answer.message);
      }
      return answer;
    } catch (err) {
      this.setState({ error_message: err.message, isLoading: false });
      toast.error('server error: '+err.message);
      return { success:false }
    }
  };
  ...
}
```

This function will do the request for us, set all the parameters for us. It's missing one thing though; we need to handle uploads. Here's a generic algorithm that takes care of handling POST parameters for us:

```js
      if(postParams){
        const data = new FormData();
        Object.keys(postParams).forEach( key => {
          const value = postParams[key]
          if(Array.isArray(value) || value instanceof FileList){
            let i = 0;
            while(i < value.length){
              data.append(`${key}[${i}]`, value[i++]);
            }
          }else if(value !== null && typeof value !== 'undefined'){
            data.append(key,value)
          }
        })
        // data contains all the parameters we gave it
      }
```

Let's add this to our previous function. Here's the complete one:

```js
// front/src/App.js
...
class App extends Component {
  ...
    request = async (path, options) => {
    try {
      this.setState({ isLoading: true });
      if(options && options.data){
        const data = new FormData();
        Object.keys(options.data).forEach( key => {
          const value = options.data[key]
          if(Array.isArray(value) || value instanceof FileList){
            let i = 0;
            while(i < value.length){
              data.append(`${key}[${i}]`, value[i++]);
            }
          }else if(value !== null && typeof value !== 'undefined'){
            data.append(key,value)
          }
        })
        options.data = data
      }
      const config = {
        method: "get",
        url: `//localhost:8080/${path}`,
        headers: { 
          Authorization: `Bearer ${auth0Client.getIdToken()}`,
          'Content-Type': options && options.data ? 'multipart/form-data' : undefined
        },
        ...options
      }
      const response = await axios(config);
      const answer = response.data
      if (answer.success) {
        this.setState({ isLoading: false });  
      } else {
        this.setState({ error_message: answer.message, isLoading: false });
        toast.error('client error:'+answer.message);
      }
      return answer;
    } catch (err) {
      this.setState({ error_message: err.message, isLoading: false });
      toast.error('server error: '+err.message);
      return { success:false }
    }
  };
  ...
}
```

We can now use it. Here's for example `getContactsList`:

```js
// front/src/App.js
...
class App extends Component {
  ...
  getContactsList = async order => {
    const answer = await this.request(`contacts/list`, {
      params: { order }
    });
    if(!answer.success){ return; }
    const contacts_list = answer.result
    this.setState({ contacts_list });
    toast("contacts loaded");
  };
  ...
}
```

As you see, we have one relatively long function, but other methods become much smaller. We've eliminated a lot of repetition.

Here are the other methods:

```js
class App extends Component {
  ...
  getContact = async id => {
    if (this.state.contacts_list.find(c => c.id === id)) {
      return;
    }
    const answer = await this.request(`contacts/get`, { params: { id } });
    if(!answer.success){ return }
    const contact = answer.result
    const contacts_list = [...this.state.contacts_list, contact];
    this.setState({ contacts_list });
    toast(`contact loaded`);
  };

  deleteContact = async id => {
    const answer = await this.request(`contacts/delete/${id}`);
    if (!answer.success || !answer.result) { return; }
    const contacts_list = this.state.contacts_list.filter(c => c.id !== id);
    this.setState({ contacts_list });
    toast(`contact deleted`);
  };

  updateContact = async (id, props) => {
    const { name, email, image } = props
    const answer = await this.request(`contacts/update/${id}`, {
      method: "post",
      data: { image },
      params: { name, email }
    });
    if (!answer.success) { return; }
    const contacts_list = this.state.contacts_list.map(contact => {
      // if this is the contact we need to change, update it. This will apply to exactly
      // one contact
      if (contact.id === id) {
        const new_contact = {
          id: contact.id,
          name: name || contact.name,
          email: email || contact.email
        };
        toast(`contact "${new_contact.name}" updated`);
        return new_contact;
      }
      // otherwise, don't change the contact at all
      else {
        return contact;
      }
    });
    this.setState({ contacts_list });
  };

  createContact = async props => {
    if (!props || !(props.name && props.email)) {
      throw new Error(
        `you need both name and email properties to create a contact`
      );
    }
    const { name, email, image } = props;
    const answer = await this.request(`contacts/new`, {
      method:'post',
      data: { image },
      params: { name, email }
    });
    if (!answer.success) { return; }
    const id = answer.result;
    const contact = { name, email, id };
    const contacts_list = [...this.state.contacts_list, contact];
    this.setState({ contacts_list });
    toast(`contact "${name}" created`);
  };

  getContactsList = async order => {
    const answer = await this.request(`contacts/list`, {
      params: { order }
    });
    if(!answer.success){ return; }
    const contacts_list = answer.result
    this.setState({ contacts_list });
    toast("contacts loaded");
  };

  getPersonalPageData = async () => {
    const answer = await this.request('mypage')
    if(!answer.success){ return; }
    const user = answer.result;
    this.setState({ user });
    if (user.firstTime) {
      toast(`welcome ${user.nickname}! We hope you'll like it here'`);
    }
    toast(`hello ${user.nickname}'`);
  };
  ...
}
```

### Remove Cruft

Now is a very good time to comb you app. Look at the `App`'s state. Read every file, make sure your methods are named correctly and make sense. Make sure there aren't unused variables.

Fix all the warnings (and, of course, the errors) that show in your console. Get your app real clean, because this is where it is still small enough to be read in an hour. You're at proof of concept stage; it's a viable, working application. It's imperative to continuously manage complexity before advancing forward.

This is a good time for testing, noting everything that is wrong, and planning on how to fix those things.


### Optional: Moving Render Functions to their Pages

In the file `front/src/App.js`, there are a bunch of `renderXXX` functions, that take a lot of space. We're going to move all of these each in their own component.

Those methods are:

- `renderUser`
- `renderUserLoggedOut`
- `renderUserLoggedIn`
- `renderHomePage`
- `renderContactPage`
- `renderProfilePage`
- `renderCreateFormPage`
- `renderContent`

Out of these, `renderContent` really has its place inside `App`; it doesn't make much sense to abstract it.

Everything else could move.

**note**: everything that was available in the scope, such as `this.submit`, will have to be passed as a prop.

For example

```js
// front/src/App.js
  renderCreateForm = () => {
    return (
      <form className="third" onSubmit={this.onSubmit}>
        <input
```

will become

```js
// front/src/pages/CreateFormPage.js
const CreateFormPage = ({ onSubmit }) => {
  return (
    <form className="third" onSubmit={onSubmit}>
      <input
```

And the function will just use the component

```js
// front/src/App.js
renderCreateForm = () => {
    return (
      <CreateFormPage onSubmit={this.onSubmit}/>
```

**note 2**: This is a lot of transferring props forward. It adds a lot of indirection for very little gain.

**IT IS ENTIRELY VALID TO NOT DO THAT**

You can just leave everything in `App.js`, and put things in external components the first time we reuse one.