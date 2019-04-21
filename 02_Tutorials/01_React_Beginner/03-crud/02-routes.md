# Controller Routes

We have a working, albeit simple, controller, which does what we need it to do. But it's only accessible to our software.

How do we make it accessible to the world?

This is when an HTTP REST interface is useful. A REST interface maps urls to controller actions.

Classical REST interfaces use http verbs, such as `PUT`, `DELETE` and so on. To keep things simple, we will only use urls (we can always increase complexity later, and using URLS will help us test in our browser without any special tooling).

Here's what we want:

- `localhost:3000/contacts/new?name=me&email=me@server.com` should add a contact (`createContact`)
- `localhost:3000/contacts/get/32` should get the contact with an id of 32 (`getContact`)
- `localhost:3000/contacts/delete/32` should delete the contact with an id of 32 (`deleteContact`)
- `localhost:3000/contacts/update/32?name="you"` should edit the contact with an id of 32, updating the name
- `localhost:3000/contacts/list?order=name` should get us the list of contacts, with ordering

Let's just do that very simply (the following assumes you know Express enough to understand `params` and `query`):

```js
...
const start = async () => {
  const controller = await initializeDatabase()
  
  app.get('/', (req, res, next) => res.send("ok"));

  // CREATE
  app.get('/contacts/new', async (req, res, next) => {
    const { name, email } = req.query
    const result = await controller.createContact({name,email})
    res.json({success:true, result})
  })

  // READ
  app.get('/contacts/get/:id', async (req, res, next) => {
    const { id } = req.params
    const contact = await controller.getContact(id)
    res.json({success:true, result:contact})
  })

  // DELETE
  app.get('/contacts/delete/:id', async (req, res, next) => {
    const { id } = req.params
    const result = await controller.deleteContact(id)
    res.json({success:true, result})
  })

  // UPDATE
  app.get('/contacts/update/:id', async (req, res, next) => {
    const { id } = req.params
    const { name, email } = req.query
    const result = await controller.updateContact(id,{name,email})
    res.json({success:true, result})
  })

  // LIST
  app.get('/contacts/list', async (req, res, next) => {
    const { order } = req.query
    const contacts = await controller.getContactsList(order)
    res.json({success:true, result:contacts})
  })

  app.listen(8080, () => console.log('server listening on port 8080'))
}

start()
```

As you see, we're just translating the controller functions to express routes, not doing much more.

If the controller throws an error, express will translate it to the front-end.

Try it! go to http://locahost:8080/contacts and try entering different urls

A few things to note:

### 1 - the { success:true, result:any } format

Previously, we were sending our data as it came. We received a list of contacts from the database, and sent that to the user.  
That's *fine*, but not **great**. It's not great because it is *ambiguous*.

We always strive to be as clear as possible. Thus, we don't want to provide a result that could be misinterpreted. We want a very clear result, that leaves no room for questioning.

Thus, we will have two answers:

When the request is **successful**, we will send back:

```json
{ "success":true,
  "result": A list of contacts, a contact, an id...
}
```

When the request **fails**, we will send back:

```json
{ "success":false,
  "message":"an error message"
}
```

We're almost there; we just need an error handler. In Express (not anywhere else! This is not a universal pattern, it is only in Express), an error handler takes this signature:

```js
app.use(( error, req, res, next ) => {
  // do something here
})
```

**note**: this *has* to be the last handler in your stack, otherwise it will catch all requests.

Let's add it, at the end of the stack, but *before* the `app.listen`:

```js
// back/src/index.js
...
  // ERROR
  app.use((err, req, res, next) => {
    console.error(err)
    const message = err.message
    res.status(500).json({ success:false, message })
  })
...
```

Finally, we need to handle possible errors in each route. That means each of them needs to be wrapped in `try{}catch`.

What was

```js
app.use( (req, res, next ) => {
  // do something
})
```

becomes:

```js
app.use( (req, res, next ) => {
  try{
    // do something
  }catch(e){
    next(e)
  }
})
```

This forwards the error to the error handler.

**note**: there are other, simpler, less cumbersome, and more "magical" ways to handle this. But we're trying to keep things controllable. By using "magical" solutions, we'd lose a bit of control over how things work, and we do not want this at this stage. We could also not use errors altogether, and make up another flow control system, but errors are native to Javascript, and everyone understand readily what they are.

Try it. Load, for example, http://localhost:8080/contacts/get/1 in your browser, and try going to invalid paths, or inputting invalid options

For example, try http://localhost:8080/contacts/get/99. Since there is no id `99`, you should get an error. The error message should correspond to the error you `throw`-ed in `db.js`.

We're finished with our http REST interface! Congrats.

## TODO:

For a production app, you'd need two things:

#### Proper HTTP Statuses

We're sending status `500` for any error, but in actuality, if for example, a contact is not found, we'd want to send `404`.

#### Logging

In production, you would want to not show the error to the user (revealing internals is always dangerous). You'd just show a generic error message. However, you would log the error, and provide the user with a specific id they can send you in an email so you can find the error in your log. You would also, for important errors, set up automated email warnings (or even sms warnings).

#### Specific Error Handling

You might want to handle certain errors differently. For example, in searches, you might want to send back "did you mean blah instead?". To do this, you could provide a code to each error, and check the code in your error handler. Or, you could handle the error inside the `catch` block, and not let it reach the error handler ever.
