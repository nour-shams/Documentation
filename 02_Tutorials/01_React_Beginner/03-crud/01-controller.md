# Controller CRUD

CRUD stands for 

- `CREATE`: create one or multiple new objects
- `READ`: read one, or several object
- `UPDATE`: edit one or several objects
- `DELETE`: delete one or several objects

Generally, you're going to:

- create one object
- update one object at a time (and maybe related objects)
- delete one object at a time (and maybe related objects)

However, you will often have multiple `READ` methods: get one article, list all articles, list all articles by date, get all articles by author, search results, etc.

For our Contacts model, we will keep it simple. We want:

1. one method to create one contact. It will take a name and an email, as one object
2. one method to delete one contact. It will take an id
3. one method to update one contact. It will take an id, and either a name, an email, or both
4. one method to read one contact.  It will receive an id 
5. one method to read all contact, with options to order them by name, or by email

That's 5 methods total. We already know their signatures, thanks to the description above. Here are the signatures:

```js
createContact = async ({ name:string, email:string }) => number|Error
deleteContact = async (id:number) => null|Error
updateContact = async (id:number,{name?:string,email?:string}) => null|Error
getContact = async (id:number) => Contact|Error
getContactsList = async (order?='name'|'email') => ContactList|Error
```

Note: the above is **not** valid Javascript. This is not actually valid *anything*. It looks a bit like ES6, a bit like Typescript, a bit like Haskell, and hopefully conveys 3 informations:

1. what the function is (`async` or `sync`)
2. what the function needs, in terms of arguments. I'm using `?` to signify the argument is optional, and `|` to signify options (e.g., `a|b` means `a` or `b`).
3. what the function returns

We already have a skeleton of `getContactsList`. We only need to implement the `order by` logic.

```js
/**
 * retrieves the contacts from the database
 * @param {string} orderBy an optional string that is either "name" or "email"
 * @returns {array} the list of contacts
 */
const getContactsList = async (orderBy) => {
  let statement = `SELECT contact_id AS id, name, email FROM contacts`
  switch(orderBy){
    case 'name': statement+= ` ORDER BY name`; break;
    case 'email': statement+= ` ORDER BY email`; break;
    default: break;
  }
  const rows = await db.all(statement)
  return rows
}
```

As you see, we construct the statement differently, depending on the `orderBy` argument.



Let's implement them very basically:

```js
// back/src/db.js
...
  const createContact = async (props) => {
    const { name, email } = props
    const result = await db.run(SQL`INSERT INTO contacts (name,email) VALUES (${name}, ${email})`);
    const id = result.stmt.lastID
    return id
  }
  
  const deleteContact = async (id) => {
    const result = await db.run(SQL`DELETE FROM contacts WHERE contact_id = ${id}`);
    if(result.stmt.changes === 0){
      return false
    }
    return true
  }
  
  const updateContact = async (id, props) => {
    const { name, email } = props
    const result = await db.run(SQL`UPDATE contacts SET email=${email} WHERE contact_id = ${id}`);
    if(result.stmt.changes === 0){
      return false
    }
    return true
  }

  const getContact = async (id) => {
    const contactsList = await db.all(SQL`SELECT contact_id AS id, name, email FROM contacts WHERE contact_id = ${id}`);
    const contact = contactsList[0]
    return contact
  }
  
  /**
   * retrieves the contacts from the database
   * @param {string} orderBy an optional string that is either "name" or "email"
   * @returns {array} the list of contacts
   */
  const getContactsList = async (orderBy) => {
    let statement = `SELECT contact_id AS id, name, email FROM contacts`
    switch(orderBy){
      case 'name': statement+= ` ORDER BY name`; break;
      case 'email': statement+= ` ORDER BY email`; break;
      default: break;
    }
    const rows = await db.all(statement)
    return rows
  }

  const controller = {
    createContact,
    deleteContact,
    updateContact,
    getContact,
    getContactsList
  }

  return controller
```

We can try them. Open `back/src/index.js, comment out everything inside of `start`, and write instead:

```js
...
const start = async () => {
  const controller = await initializeDatabase()
  /** 
  ... previous code commmented out
   **/
  const id = await controller.createContact({name:"Brad Putt",email:"brad@pet.com"})
  const contact = await controller.getContact(id)
  console.log("------\nmy newly created contact\n",contact)
 // await controller.updateContact(id, {name:"Brad Pitt"})
  await controller.updateContact(id, {email:"brad@pitt.com"})
  const updated_contact = await controller.getContact(id)
  console.log("------\nmy updated contact\n",updated_contact)
  console.log("------\nlist of contacts before\n",await controller.getContactsList())
  await controller.deleteContact(id)
  console.log("------\nlist of contacts after deleting\n",await controller.getContactsList())
  
}
...
```

Run it, observe the output in your terminal.

One confusing part might be this `result.stmt` stuff that is going on from time to time. This is returned from `sqlite`'s `run` method, and has this shape:

```json
{
  stmt:{
    lastID:number,
    changes:number
  }
}
```

`lastID` contains the last ID operated on, and `changes` contains a number representing the number of changes.

Take some time, try to understand what those methods are doing. Try thinking how you would, for example, implement a `getContactByName` or `getContactByEmail` function.

Do take a moment, because they're going to get more complex right after this. We need to do error checking, and make sure we receive the right arguments. While none of that is going to be difficult, those checks will decrease the readability of the code.

I will also add documentation, in the `jsdoc` format. This format is a comment, over the function, that explains what it does. This also pops up in some editors (like VSCode) when using the function.

Ready? Let's add checks:

```js
// back/src/db.js
const initializeDatabase = async () => {

  const db = await sqlite.open('./db.sqlite');
  
  /**
   * creates a contact
   * @param {object} props an object with keys `name` and `email`
   * @returns {number} the id of the created contact (or an error if things went wrong) 
   */
  const createContact = async (props) => {
    if(!props || !props.name || !props.email){
      throw new Error(`you must provide a name and an email`)
    }
    const { name, email } = props
    try{
      const result = await db.run(SQL`INSERT INTO contacts (name,email) VALUES (${name}, ${email})`);
      const id = result.stmt.lastID
      return id
    }catch(e){
      throw new Error(`couldn't insert this combination: `+e.message)
    }
  }
  
  /**
   * deletes a contact
   * @param {number} id the id of the contact to delete
   * @returns {boolean} `true` if the contact was deleted, an error otherwise 
   */
  const deleteContact = async (id) => {
    try{
      const result = await db.run(SQL`DELETE FROM contacts WHERE contact_id = ${id}`);
      if(result.stmt.changes === 0){
        throw new Error(`contact "${id}" does not exist`)
      }
      return true
    }catch(e){
      throw new Error(`couldn't delete the contact "${id}": `+e.message)
    }
  }
  
 /**
   * Edits a contact
   * @param {number} id the id of the contact to edit
   * @param {object} props an object with at least one of `name` or `email`
   */
  const updateContact = async (id, props) => {
    if (!props || !(props.name || props.email)) {
      throw new Error(`you must provide a name or an email`);
    }
    const { name, email } = props;
    try {
      let statement = "";
      if (name && email) {
        statement = SQL`UPDATE contacts SET email=${email}, name=${name} WHERE contact_id = ${id}`;
      } else if (name) {
        statement = SQL`UPDATE contacts SET name=${name} WHERE contact_id = ${id}`;
      } else if (email) {
        statement = SQL`UPDATE contacts SET email=${email} WHERE contact_id = ${id}`;
      }
      const result = await db.run(statement);
      if (result.stmt.changes === 0) {
        throw new Error(`no changes were made`);
      }
      return true;
    } catch (e) {
      throw new Error(`couldn't update the contact ${id}: ` + e.message);
    }
  }

  /**
   * Retrieves a contact
   * @param {number} id the id of the contact
   * @returns {object} an object with `name`, `email`, and `id`, representing a contact, or an error 
   */
  const getContact = async (id) => {
    try{
      const contactsList = await db.all(SQL`SELECT contact_id AS id, name, email FROM contacts WHERE contact_id = ${id}`);
      const contact = contactsList[0]
      if(!contact){
        throw new Error(`contact ${id} not found`)
      }
      return contact
    }catch(e){
      throw new Error(`couldn't get the contact ${id}: `+e.message)
    }
  }
  
  /**
   * retrieves the contacts from the database
   * @param {string} orderBy an optional string that is either "name" or "email"
   * @returns {array} the list of contacts
   */
  const getContactsList = async (orderBy) => {
    try{
      
      let statement = `SELECT contact_id AS id, name, email FROM contacts`
      switch(orderBy){
        case 'name': statement+= ` ORDER BY name`; break;
        case 'email': statement+= ` ORDER BY email`; break;
        default: break;
      }
      const rows = await db.all(statement)
      if(!rows.length){
        throw new Error(`no rows found`)
      }
      return rows
    }catch(e){
      throw new Error(`couldn't retrieve contacts: `+e.message)
    }
  }
  
  const controller = {
    createContact,
    deleteContact,
    updateContact,
    getContact,
    getContactsList
  }

  return controller
}
```

Re-run the software. The output in the terminal should not have changed; however, if you try illegal things, it should not work.

Try to make the software crash by changing the arguments in `index.js`.

For example, let's try to add two users with the same email:

```js
// back/src/index.js
await controller.createContact({name:"Brad Putt",email:"brad@pet.com"})
await controller.createContact({name:"Brad Putt",email:"brad@pet.com"})
console.log("------\nlist of contacts after deleting\n",await controller.getContactsList())
```

We should get an error. Once we've verified our controller works, we can restore `index.js` to what it was, and uncomment the previous code.