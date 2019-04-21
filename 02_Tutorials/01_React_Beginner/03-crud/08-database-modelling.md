# Database Modelling & Routing Enhancements

Until now, we've been working with a very simple table, just a list of contacts.

This was good, but kind of extremely simple, in comparison with real applications.

We're going to do a few things here:

1. create a [migration script](https://en.wikipedia.org/wiki/Schema_migration) for our database. A *migration script* is a piece of code that creates our database tables, and then updates them. Its presence insures every one working on the project has the same database 
2. add a `users` table to the database, so we keep track of our users
3. add a `author_id` column to contacts. Contacts will be visible to everyone, but only the authors will be able to edit them or delete them

Later, we will:

1. add a `contact_image` column to the `contacts` table, so we can have images
2. add file uploads capability to both React and Express


## Create the Initial Migration Script

There's no definite way to write a migration script. It can be any language, any system. One thing matters: the script should be simple to run, and when it is, every computer that ran it should have the same database.

If we're using the [sqlite](https://github.com/kriasoft/node-sqlite) module, there is a migration system baked in:

1. Create a directory called `migrations` in the root (*not* in `src`!)
2. Create a file called `001-initial-schema.sql`. Write in it the SQL code that creates the database. Write also in it the code to destroy the database.
3. Later, when the database changes, create a file called `002-whatever_you_want.sql`, with the changes   
4. Add a line in your code `db => db.migrate({ force: 'last' })`, which reads those files and applies them (Don't forget: you probably want to change that for your production build!) .

You can see an example in the [sqlite documentation](https://github.com/kriasoft/node-sqlite#migrations)

Let's remind ourselves of our database schema.

This is what it is:

![the contacts table, with two fields, name and email](../Assets/08-contacts-01.png)

And this would be the migration file for it.

```sql
--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
DROP TABLE contacts;
```

Go ahead, and write this in a file `/back/migrations/001-contacts.sql`

While we're at it, let's also add some content. In the `Up` section, below the table creation, add:

```sql
-- back/migrations/001-contacts.sql
...
INSERT INTO contacts (name, email) VALUES ("Harry Potter","harry@potter.co.uk");
INSERT INTO contacts (name, email) VALUES ("Sherlock Holmes","sherlock@holmes.co.uk");
INSERT INTO contacts (name, email) VALUES ("Mary Poppins","mary@poppins.co.uk");
INSERT INTO contacts (name, email) VALUES ("Lady Macbeth","lady@beth.mc");
INSERT INTO contacts (name, email) VALUES ("Daenerys Targaryen","drago@lannis.tr");
...
```

finally, in `db.js`, under the line that create the database, add:

```js
// back/src/db.js
  const db = await sqlite.open('./db.sqlite');
  await db.migrate({ force: 'last' })
```

Run your application now, you should see the new database changes. Good!

## Add the New Table

Let's add the migration we need. Add a new file, `002-users` to the `migrations` directory.

This is the new schema we're going for:

![the contacts table and users table, with a connection](../Assets/08-contacts-02.png)

```sql
--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    auth0_sub TEXT UNIQUE, -- this will store the id returned by Auth0
    nickname TEXT
);

INSERT INTO users (auth0_sub, nickname) VALUES ("auth0|5bfe6e775da66525bbede529","jad@codi.tech");
INSERT INTO users (auth0_sub, nickname) VALUES ("google-oauth2|104600149175848010526","jad@codi.tech");
INSERT INTO users (auth0_sub, nickname) VALUES ("fakeId","fake@fake.com");

ALTER TABLE contacts RENAME TO old_contacts;

CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    date TEXT,
    author_id TEXT,
    FOREIGN KEY(author_id) REFERENCES users(auth0_sub)
);

-- copy old data in new table
-- all previous contacts are for the first user
INSERT INTO contacts (contact_id, name, email, date, author_id) SELECT contact_id, name, email, "2010-10-10 10:10:10.000","auth0|5bfe6e775da66525bbede529" FROM old_contacts;

-- remove previous table
DROP TABLE old_contacts;

INSERT INTO contacts (name, email, date, author_id) VALUES ("Patrick Bateman","pat@batman.io", "2009-10-10 10:10:10.000","facebook-thing|fakeId");
INSERT INTO contacts (name, email, date, author_id) VALUES ("Hannibal Lecter","hani@food.org", "2011-10-10 10:10:10.000","facebook-thing|fakeId");

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
DROP TABLE users;

ALTER TABLE contacts RENAME TO old_contacts;

CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
);

-- delete new contacts:
DELETE FROM old_contacts WHERE author_id = "fakeId";

-- copy old data to previous table
INSERT INTO contacts (contact_id, name, email) SELECT contact_id, name, email FROM old_contacts;

DROP TABLE old_contacts;
```

Yes, I'm in there twice, because I logged in once through google, and once through email. I `console.log`ged the user object returned by Auth0, and noted the `sub` property.

**note**: we're using the `auth0_sub` as a property to link the two tables. We really should be using the `users`' `nickname` instead, so the same email is considered the same user. However, this would add lines to our code, because for each request to change a contact, we'd need to verify that the auth0 id used matches the email of the contact's author before allowing the change. It is easy to do, but would make this tutorial even longer, so we'll skip that for now.

## Handle Changes in the Controller 

You notice that the date is in a specific text format. Here's a function that will provide you with that format from Javascript:

```js
/**
 * returns a date formatted like `YYYY-MM-DD HH:mm:ss.sss`, suitable for sqlite
 **/
const nowForSQLite = () => new Date().toISOString().replace('T',' ').replace('Z','')
```

Stick it at the top of your controller (`db.js`)

Let's add a few methods to our controller. We're going to need:

1. change the method that gets contacts so it can optionally get all contacts from a specific user
2. change the method that updates a contact so it cannot update a contact without a proper `author_id` (for added security); same for `delete`
3. changee the create method so it records the `author_id`
4. a new method that creates a user on the fly. Users are not created by registering. Users are created automatically when Auth0 answers. This method will first check if the user already exists (has logged in in the past). If yes, it will do nothing. If not, it will create the user.

First, let's change `getContactsList`.

```js
// back/src/db.js
...
  const getContactsList = async props => {
    const { orderBy, author_id, desc, start } = props
    try {
      const statement = SQL`SELECT contact_id AS id, name, email, date, author_id FROM contacts`;
      if(author_id){
        statement.append(SQL` WHERE author_id = ${author_id}`)
      }
      const isValidOrderBy = /name|email|date/.test(orderBy)
      if(isValidOrderBy){
        statement.append( desc? SQL` ORDER BY ${orderBy} DESC` : SQL` ORDER BY ${orderBy} ASC`);
      }
      const rows = await db.all(statement);
      /**
       * Let's remove this:
       * if (!rows.length) {
      *   throw new Error(`no rows found`);
       * }
       * we don't want an error when there are 0 contacts
       **/
      return rows;
    } catch (e) {
      throw new Error(`couldn't retrieve contacts: ` + e.message);
    }
  };
...
```

Now, `getContactsList` can get all contacts from a specific user.

**note**: We could profit from the occasion to add some pagination. Most tutorials tell you to use `limit` and `offset`, but as described [in this article on AllYouNeedIsBackend](http://allyouneedisbackend.com/blog/2017/09/24/the-sql-i-love-part-1-scanning-large-table/), it is rather slow. We'll use the technique called `keyset pagination`. This will not be explained in this tutorial, however you can check the code [here](./project/back/src/db.js)

Similarly, let's change the update & delete methods so they don't work without `author_id`:

```js
// back/src/db.js
...
  /**
   * Edits a contact
   * @param {number} id the id of the contact to edit
   * @param {object} props an object with at least one of `name` or `email`, and `author_id`
   */
  const updateContact = async (id, props) => {
    if ((!props || !(props.name || props.email) || !props.author_id)) {
      throw new Error(`you must provide a name, email, and author_id`);
    }
    const { name, email, author_id } = props;
    try {
      const statement = SQL`UPDATE contacts`;
      if (name && email) {
        statement.append(SQL` SET email=${email}, name=${name}`);
      } else if (name) {
        statement.append(SQL` SET name=${name}`);
      } else if (email) {
        statement.append(SQL` SET email=${email}`);
      }
      statement.append(
        SQL` WHERE contact_id = ${id} AND author_id = ${author_id}`
      );
      const result = await db.run(statement);
    ...
  };
  /**
   * deletes a contact
   * @param {Object} props the id of the contact to delete, and the id of the author
   * @returns {boolean} `true` if the contact was deleted, an error otherwise
   */
  const deleteContact = async props => {
    const { id, author_id } = props
    try {
      const result = await db.run(
        SQL`DELETE FROM contacts WHERE contact_id = ${id} AND author_id = ${author_id}`
      );
      if (result.stmt.changes === 0) {
        throw new Error(`contact "${id}" does not exist or wrong author_id`);
      }
    ...
  };
...
```

What we've mainly done here is change the function to include the `author_id` in the `WHERE` clause. This way, if we try to edit a contact without providing the proper `author_id`, an error will be thrown and the operation will fail.

Now, let's change the `create` method:

```js
// back/src/db.js
...
  /**
   * creates a contact
   * @param {object} props an object with keys `name`, `email`, and `author_id`
   * @returns {number} the id of the created contact (or an error if things went wrong)
   */
  const createContact = async props => {
    if (!props || !props.name || !props.email || !props.author_id) {
      throw new Error(`you must provide a name, an email, and an author_id`);
    }
    const { name, email, author_id } = props;
    const date = nowForSQLite();
    try {
      const result = await db.run(
        SQL`INSERT INTO contacts (name,email, date, author_id) VALUES (${name}, ${email}, ${date}, ${author_id})`
      );
    ...
  };
...
```

Finally, let's add the `createUser` and `createUserIfNotExists` methods:

```js
// back/src/db.js
/**
 * returns a date formatted like `YYYY-MM-DD HH:mm:ss.sss`, suitable for sqlite
 **/
const nowForSQLite = () => new Date().toISOString().replace('T',' ').replace('Z','')
... 
  /**
   * Checks if a user with the provided auth0_sub exists. If yes, does nothing. If not, creates the user.
   * @param {Object} props an object containing the properties `auth0_sub` and `nickname`. 
   */
  const createUserIfNotExists = async props => {
    const { auth0_sub, nickname } = props;
    const answer = await db.get(
      SQL`SELECT user_id FROM users WHERE auth0_sub = ${auth0_sub}`
    );
    if (!answer) {
      await createUser(props)
      return {...props, firstTime:true } // if the user didn't exist, make that clear somehow
    }
    return props;
  };

  /**
   * Creates a user
   * @param {Object} props an object containing the properties `auth0_sub` and `nickname`.  
   */
  const createUser = async props => {
    const { auth0_sub, nickname } = props;
    const result = await db.run(SQL`INSERT INTO users (auth0_sub, nickname) VALUES (${auth0_sub},${nickname});`);
    return result.stmt.lastID;
  }
...
  const controller = {
    ...,
    createUserIfNotExists,
    createUser
    ...
  }
```



And, let's reflect those changes on our router. We want to ensure the user is logged in before `create`, `update`, and `delete`:

```js
// back/src/index.js
  // CREATE
  app.get("/contacts/new", isLoggedIn, async (req, res, next) => {
    const author_id = req.user.sub
    try {
      const { name, email } = req.query;
      const result = await controller.createContact({ name, email, author_id });
      ...
  });

  // READ
  app.get("/contacts/get/:id", async (req, res, next) => {
    ... nothing changes here
  });

  // DELETE
  app.get("/contacts/delete/:id", isLoggedIn, async (req, res, next) => {
    const author_id = req.user.sub
    try {
      const { id } = req.params;
      const result = await controller.deleteContact({id, author_id});
      ...
  });

  // UPDATE
  app.get("/contacts/update/:id", isLoggedIn, async (req, res, next) => {
    const author_id = req.user.sub
    try {
      const { id } = req.params;
      const { name, email } = req.query;
      const result = await controller.updateContact(id, { name, email, author_id });
      ...
  });

  // LIST
  app.get("/contacts/list", async (req, res, next) => {
    try {
      const { order, desc } = req.query;
      const contacts = await controller.getContactsList({order, desc});
      res.json({ success: true, result: contacts });
    } catch (e) {
      next(e);
    }
  });

  app.get('/mypage', isLoggedIn, async ( req, res, next ) => {
    try{
      const { order, desc } = req.query;
      const { sub, nickname} = req.user
      const user = await controller.createUserIfNotExists({sub, nickname})
      const contacts = await controller.getContactsList({order, desc, author_id:sub})
      user.contacts = contacts
      res.json({ success: true, result: user });
    }catch(e){
      next(e)
    }
  })
```

## Use the Authentication From the Front End

Finally, let's send the authentication token with every request. in `front/src/App.js`, everywhere you use `fetch`, send the proper headers:

```js
const response = await fetch(url,{ headers: { Authorization: `Bearer ${auth0Client.getIdToken()}` }});
```

We are now all set!

If you try to create a contact now without being logged in, you will get an error.

3 things left to do:

1. on the profile page, show the user's contacts
2. do not show the `create` page at all if the user is not logged in
3. do not show the `edit` or `delete` buttons if the user is not logged in (or doesn't have permission to see the note)

### Show User's Contacts on the Profile Page

Until now, we've used `getPersonalPageData` just to test if everything is working well. It runs when the user logins, and just puts the server's message in a pop-up (which has since long been showing the unhelpful message `[object Object]`).

We'll change it to put all the stuff we need in state.

first, remove the line 

```js
this.forceUpdate();
```

Since we will modify the state, our Component will update, no need to force anything

We will also replace the lines in `login` 

```js
  const name = auth0Client.getProfile().name; // get the data from Auth0
  await this.getPersonalPageData(); // get the data from our server
  toast(`${name} is logged in`);
```

with just

```js
  await this.getPersonalPageData(); // get the data from our server
```

in `getPersonalPageData`, add:

```js
...
  if (answer.success) {
    const user = answer.result;
    this.setState({user})
    if(user.firstTime){
      toast(`welcome ${user.nickname}! We hope you'll like it here'`);
    }
    toast(`hello ${user.nickname}'`);
  }
...
```

We're now setting the user in `state` when they log in. We're also calling `getPersonalPageData` both when we `login` and after `silentAuth`, so it will be set both when the user has just logged in, and when the user has just refreshed the page

the `user` object that we're sending from the database contains an array of `contact`s. We can now display those on the user's page:

```js
// front/src/App.js
...
  renderUserLoggedIn() {
    ...
        <div>
          <ContactList contacts_list={this.state.user.contacts} />
        </div>
      </div>
    );
  }
...
```

If you now load the profile page while being logged in, you will see the contacts you have added yourself (provided you have created any).


Little problem though:

If you edit a contact, then go back to the profile page, you will see the contact is *not* updated there (unless you refresh). The reason is that the contact inside the `user` key in `state` is duplicated. The edited contact resides in the `state`'s `contacts_list`. This is relatively simple to fix: we simply have to use the same contacts everywhere.

Instead of using the contacts in the user's array, we will just use it to reference contacts from the main array.

Here's how it looks:

```js
user.contacts.map( contactFromUser => this.state.contacts_list.find( contactFromMain => contactFromMain.id === contactFromUser.id))
```

Let's use it:

```js
// front/src/App.js
...
  renderUserLoggedIn() {
    ...
    const user_contacts = this.state.user.contacts.map(contactFromUser =>
      this.state.contacts_list.find(
        contactFromMain => contactFromMain.id === contactFromUser.id
      )
    );
    ...
        <div>
          <ContactList contacts_list={user_contacts} />
        </div>
      </div>
    );
  }
...
```


### Conditionally hide or show elements

Currently, any user has access to all pages, even if they don't work. For example, even a non logged-in user has access to the create page, even though they can't submit.

We want to:

1. hide things depending on if the user is logged in or not
2. make some routes conditional

For both those things, we're going to create what we call *Higher Order Components*, or **HOC** for short.

HOCs are components that contain other components. For example, we could have

```js
<If condition={myVar==2}>
  <p>myVar is equal to 2!!</p>
</If>

const If = ({ condition, children }) => {
  if(condition){
    return children
  }else{
    return false
  }
}
```

This is kinda contrived, but it is valid code.

What we want is something like:

```js
<HideIfUserNotLoggedIn>
  <p>Hello logged in user!</p>
</HideIfUserNotLoggedIn>
```

In the example above `HideIfUserNotLoggedIn` doesn't show for the user. It just conditionally renders it's content (the `children` property, in React parlance).

We will implement almost exactly that, we'll just call it something a little more sensible than `HideIfUserNotLoggedIn`.

Create a new file, call it `IfAuthenticated.js`:

```js
// front/src/IfAuthenticated

// import React from 'react'
// no need to import React if we don't use JSX
import * as auth0Client from "./auth";

const IfAuthenticated = ({ children, else:otherwise }) => {
  const isLoggedIn = auth0Client.isAuthenticated();
  if(isLoggedIn){
    return children
  }else{
    return otherwise || null
  }
}
export default IfAuthenticated
```


**note**: The children are *still* evaluated. Which means if `user` is not set, this code will give us an error `user is undefined`:

```js
<IfAuthenticated>
  <p>show ${user.nick}</p>
</IfAuthenticated>
```

Because the children are read and evaluated, whether they end up rendering or not. Bear that in mind when you use this component.

Let's use this component. We're going to hide

1. the `profile` and `create` links if the user is not authenticated
2. the `edit` and `delete` buttons on the contact if the user is not authenticated

While we're editing the `Contact` component, we'll also make it so the edit and delete buttons *also* don't show if the current user is not the author

```js
// front/src/App.js
...
import IfAuthenticated from './IfAuthenticated'
...
  renderContactPage = ({ match }) => {
    ...
    // pass the author to the Contact Component
    return (
      <Contact
        ...
        author_id={contact.author_id}
        ...
      />
    );
  };
...
  render() {
    return (
      <div className="App">
        <div>
          <Link to="/">Home</Link> |
          <Link to="/profile">profile</Link> |
          <IfAuthenticated>
            <Link to="/create">create</Link>
          </IfAuthenticated>
        </div>
        {this.renderContent()}
        <ToastContainer />
      </div>
    );
  }
```

```js
// front/src/Contact.js
...
import * as auth0Client from "./auth";
...
  renderViewMode() {
    const { id, name, author_id, deleteContact } = this.props;
    const isLoggedIn = auth0Client.isAuthenticated();
    const current_logged_in_user_id = isLoggedIn && auth0Client.getProfile().sub
    const is_author = author_id === current_logged_in_user_id
    console.log(author_id, current_logged_in_user_id)
    return (
      <div>
        <span>
          {id} - {name}
        </span>
        { is_author && isLoggedIn ?
          <div>
              <button onClick={this.toggleEditMode} className="success">
                edit
              </button>
              <button onClick={() => deleteContact(id)} className="warning">
                x
              </button>
          </div>
        : false
        }
      </div>
    );
  }
...
```

Last but not least, we want to protect the routes. We've hidden the links, but for example, someone can still navigate to `/create`. It shouldn't work.

What we will do is create a Higher Order Component that wraps `react-router`'s `<Route>` (itself a *HOC*). It will be called `SecureRoute` and will work like that:

```js
<Route path="/home" render={()=>"allowed"}/>
<SecuredRoute path='/new-question' render={()=>"only if authenticated"} checkingSession={this.state.checkingSession} />
```

Let's implement it. Open a file `SecuredRoute.js`:

```js
// front/src/SecuredRoute.js
import React from "react";
import { Route } from "react-router-dom";
import * as auth0Client from "./auth";

export const Validating = () => <h3 className="text-center">Validating session...</h3>;

export const Forbidden = () => <div>Forbidden</div>;

const SecuredRoute = ({ component, render, path, checkingSession }) => {

  const renderIf = props => {
    if (checkingSession) {
      return <Validating />;
    }
    if (!auth0Client.isAuthenticated()) {
      auth0Client.signIn();
      return <Forbidden />;
    }
    if (render) {
      return render(props);
    }
    const Component = component
    return <Component {...props} />;
  };

  return <Route path={path} render={renderIf} />;
};

export default SecuredRoute;

```

Then, let's use it:

```js
// front/src/App.js
...
import SecuredRoute from './SecuredRoute
...
// replace
// <Route path="/create" render={this.renderCreateForm} />
// with:
<SecuredRoute path="/create" render={this.renderCreateForm} checkingSession={this.state.checkingSession}/>
```

Congratulations! You have a proper database, with foreign keys, relations, and proper permissions for editing.