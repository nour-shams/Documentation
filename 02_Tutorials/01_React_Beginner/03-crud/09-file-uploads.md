# Files Uploads

This process will be split in 3 parts:

1. add a `contact_image` column to the `contacts` table
2. add file uploads capability to React
3. add file receiving capability to Express

## Migration

In a first instance, we need to create a new migration script for `contacts`. Put it in `back/migrations`, call it `003-images.sql`:

```sql
--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------
ALTER TABLE contacts RENAME TO old_contacts;

CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    author_id TEXT,
    date TEXT,
    image TEXT,
    FOREIGN KEY(author_id) REFERENCES users(auth0_sub)
);

-- copy old data in new table
-- all previous contacts are for the first user
INSERT INTO contacts (contact_id, name, email, date, author_id) SELECT contact_id, name, email, date, author_id FROM old_contacts;

-- remove previous table
DROP TABLE old_contacts;

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------
ALTER TABLE contacts RENAME TO old_contacts;

CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    author_id TEXT,
    date TEXT,
    FOREIGN KEY(author_id) REFERENCES users(auth0_sub)
);

-- delete new contacts:
DELETE FROM old_contacts WHERE author_id = "fakeId";

-- copy old data to previous table
INSERT INTO contacts (contact_id, name, email, date, author_id) SELECT contact_id, name, email, date, author_id FROM old_contacts;

DROP TABLE old_contacts;
```

We're going to add the new property in `db.js` and `controller.js`. Since we're beginning to have a lot of properties, having a dozen `ifs` in updates can be very cumbersome. Let's create a little function that helps us. Put it in `db.js`:

```js
// back/src/db.js
...
/**
 * 
 * Joins multiple statements. Useful for `WHERE x = 1 AND y = 2`, where the number of arguments is variable.
 * 
 * Usage:
 * 
 * joinSQLStatementKeys( ["name", "age", "email"], { email:"x@y.c", name="Z"}, ", ")
 * 
 * 
 * Will return an SQL statement corresponding to the string:
 * 
 * name="Z", email="x@y.c"
 * 
 * 
 * @param {Array} keys an array of strings representing the properties you want to join 
 * @param {Object} values an object containing the values 
 * @param {string} delimiter a string to join the parts with
 * @param {string} keyValueSeparator a string to join the parts with
 * @returns {Statement} an SQL Statement object
 */
const joinSQLStatementKeys = (keys, values, delimiter , keyValueSeparator='=') => {
  return keys
    .map(propName => {
      const value = values[propName];
      if (value !== null && typeof value !== "undefined") {
        return SQL``.append(propName).append(keyValueSeparator).append(SQL`${value}`);
      }
      return false;
    })
    .filter(Boolean)
    .reduce((prev, curr) => prev.append(delimiter).append(curr));
};
...

const initializeDatabase = async () => {
...
  /**
   * creates a contact
   * @param {object} props an object with keys `name`, `email`, `image`, and `author_id`
   * @returns {number} the id of the created contact (or an error if things went wrong)
   */
  const createContact = async props => {
    if (!props || !props.name || !props.email || !props.author_id) {
      throw new Error(`you must provide a name, an email, an author_id`);
    }
    const { name, email, author_id, image } = props;
    ...
    const result = await db.run(
        SQL`INSERT INTO contacts (name,email, date, image, author_id) VALUES (${name}, ${email}, ${date}, ${image}, ${author_id})`
      );
    ...
  };

  /**
   * Edits a contact
   * @param {number} contact_id the id of the contact to edit
   * @param {object} props an object with at least one of `name`,`email` or `image`, and `author_id`
   */
  const updateContact = async (contact_id, props) => {
    if (
      (!props || !(props.name || props.email || props.image), !props.author_id)
    ) {
      throw new Error(
        `you must provide a name, or email, or image, and an author_id`
      );
    }
    try {
      const previousProps = await getContact(contact_id)
      const newProps = {...previousProps, ...props }
      const statement = SQL`UPDATE contacts SET `
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
            { contact_id:contact_id, author_id:props.author_id },
            " AND "
          )
        );
      const result = await db.run(statement);
      if (result.stmt.changes === 0) {
        throw new Error(`no changes were made`);
      }
      return true;
    } catch (e) {
      throw new Error(`couldn't update the contact ${contact_id}: ` + e.message);
    }
  };

  ...

  const getContact = async id => {
    try {
      const contactsList = await db.all(
        SQL`SELECT contact_id AS id, name, email, image, author_id FROM contacts WHERE contact_id = ${id}`
      );
     ...
  };

  ...
  const getContactsList = async props => {
    ...
    try {
      const statement = SQL`SELECT contact_id AS id, name, email, date, image, author_id FROM contacts WHERE ${orderBy} > ${startingId}`;

```

Done! Let's see how to handle uploads now

## Sending Uploads From React

We will:

1. add a file field to the create and update form
2. get the data from that field on submit
3. change the method of `fetch` for `update` and `create` so it uses `POST` (this is necessary for uploads).
4. prepare an image field to receive the property

All fairly simple, so we're not going to waste a lot of time in explanations. We should still try to understand how a file input works:

```js
onSubmit = evt => {
  evt.preventDefault() // stop the page from refreshing
  const input = evt.target.fileField
  // instead of input.value, a file field has a `files` property
  const filesList = input.files // fileList is like an array, but not really an array
  const filesArray = [...fileList] // we transform it into an array
  // we now have an array of files, to use as we wish
}
render(){
  return <form onSubmit={this.onSubmit}>
    <input type="text" name="textField"/>
    <input type="file" multiple name="fileField"/>
  </form>
}
```

the `onSubmit` above can be re-written more simply as

```js
onSubmit = evt => {
  evt.preventDefault() // stop the page from refreshing
  const filesArray = [...evt.target.fileField.files]
}
```

If the field has only one file (`multiple` not set), then we can do:

```js
onSubmit = evt => {
  evt.preventDefault() // stop the page from refreshing
  const file = evt.target.fileField.files[0]
}
```

Lastly, the way to send files through fetch is like so:

```js
onSubmit = evt => {
  evt.preventDefault() // stop the page from refreshing
  const filesArray = [...evt.target.fileField.files]
  const body = new FormData();
  filesArray.map((file, index) => body.append(`files[${index}]`, file))
  body.append('text', evt.target.textField.value)
  fetch('http://localhost:3000/upload-path', { method:'POST', body })
}
```

For both the `update` and `create` form:

1. add a file input field called "contact_image_input" `<input type="file" name="contact_image_input"/>`
2. in each form's `onSubmit`
  1. capture the files array
  2. change `fetch`'s method to `POST`
  3. append the body

Then, in `<Contact>`, we'll add a div to show the image

(don't forget to also pass `image={contact.image}` when you use `<Contact/>`)

Here is a summary of the changes:

```js
// front/src/App.js
...
  updateContact = async (id, props) => {
    ...

      let body = null;

      if(props.image){
        body = new FormData();
        body.append(`image`, props.image)
        /**
         * NOTE:
         * If you were uploading several files, you'd do:
         * body.append(`image[0]`, image1)
         * body.append(`image[1]`, image2)
         * ...
         **/
      }

      const response = await fetch(url, {
        method:'POST', 
        body,
        headers: { Authorization: `Bearer ${auth0Client.getIdToken()}` }
      });
    ...
  }
  ...
  createContact = async props => {
    try {
      ...
      const { name, email, image } = props;
      
      ...

      let body = null;

      if(image){
        body = new FormData();
        body.append(`image`, image)
      }
      
      const response = await fetch(url, {
        method:'POST', 
        body,
        headers: { Authorization: `Bearer ${auth0Client.getIdToken()}` }
      });
      ...
    }
...
  onSubmit = evt => {
    ...
    // get the files
    const image = evt.target.contact_image_input.files[0]
    // create the contact from mail and email
    this.createContact({ name, email, image });
    ...
  };
...
  renderCreateForm = () => {
    return (
      ...
        <input
          type="file"
          name="contact_image_input"
        />
        ...
    );
  };
...
  renderContactPage = ({ match }) => {
    ...
      return (
        <Contact
          ...
          image={contact.image}
          ...
        />
      );
    ...
  }
```

```js
// front/src/Contact.js
...
  renderViewMode() {
    const { id, name, author_id, deleteContact, image } = this.props;
    ...
    return (
      <div>
        { image && <img src={`//localhost:8080/images/${image}`} alt={`the avatar of ${name}`}/> }
      ...
      </div>
    )
  }
...
  renderEditMode() {
    ...
        <input
          type="file"
          name="contact_image_input"
        />
      ...
    );
  }
...
  onSubmit = evt => {
    ...
    const contact_image_input = form.contact_image_input;
    // extract the values
    const name = contact_name_input.value;
    const email = contact_email_input.value;
    const image = contact_image_input.files[0];
    ...
    updateContact(id, { name, email, image });
  };
...
```

**note**: we're uploading the images in `/back`, so it's natural that we serve the images from there. Thus, the `//localhost:8080/images/` in image sources

Your front-end is ready to send files

## Receiving Uploads on Express

We will:

1. set Multer to receive images, and change some methods to `POST`.
2. store the images somewhere public, and get the path
3. send that path to the database

Doing file uploads by hand is tricky, so we'll use [Multer](https://github.com/expressjs/multer). If you've followed all steps, we already installed it previously. If not, move to `back` and run

```sh
npm install --save multer
```

You can now use it with an express app like so:

```js
import multer from  'multer'

const upload = multer({ dest: 'uploads/' })

app.post('/upload-resume', upload.single('resume'), (req, res, next)=>{
  console.log(req.file)
})

app.post('/galleries-photos', upload.array('photos',10), (req, res, next)=>{
  console.log(req.files)
})
```

a `multer` file looks like so:

- `fieldname`: Field name specified in the form 	
- `originalname`: Name of the file on the user's computer 	
- `encoding`: Encoding type of the file 	
- `mimetype`: Mime type of the file 	
- `size`: Size of the file in bytes 	
- `destination`: The folder to which the file has been saved
- `filename`: The name of the file within the destination
- `path`: The full path to the uploaded file
- `buffer`: A Buffer of the entire file

----

We need to set it a multer upload point before `create` and `update`.

Since we want the images we're saving to be accessible to users, we need to store them in `/public`.

Add multer, and create an upload point:

```js
// back/src/index.js
...
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
```

Then, let's add it to the two methods. Add it *after* `isLoggedIn` (no need to process the image if the user isn't logged in). Don't forget to change `get`s to `post`s!


```js
// back/src/index.js
...

  // CREATE
  app.post("/contacts/new", isLoggedIn, upload.single('image'), async (req, res, next) => {
    const author_id = req.user.sub
    try {
      const { name, email } = req.query;
      const image = req.file && req.file.filename
      const result = await controller.createContact({ name, email, image, author_id });
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  });

...
  // UPDATE
  app.post("/contacts/update/:id", isLoggedIn, upload.single('image'), async (req, res, next) => {
    const author_id = req.user.sub
    try {
      const { id } = req.params;
      const { name, email } = req.query;
      const image = req.file && req.file.filename
      const result = await controller.updateContact(id, { name, email, author_id, image });
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  });
```

And bam! File uploads work

**note**: You'll notice that when you create or edit a contact, you need to refresh to see the image. It's not immediately there because we aren't changing the browser-side representation of the contact. This is not very elegant, but also not essential, and we can think about it later.

You might want to ignore the images uploaded by adding `**/*public/images` to your `.gitignore`. It's not necessary, and you should do it depending if you feel your images are part of your core website or not.