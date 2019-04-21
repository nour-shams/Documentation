# Making life easier on the back-end

To handle requests, we could use the native `http` module, but it can get cumbersome to read the url, to determine different routes, to check which http verb was used, and so on. A bit of help doesn't hurt. There, too, we have a lot of contenders ([Fastify](https://www.fastify.io/), [Restify](http://restify.com/), [Koa](https://koajs.com/), [Polka](https://www.npmjs.com/package/polka), [Restana](https://www.npmjs.com/package/restana), ...). Two main ones are [Hapi](https://hapijs.com/) and [Express](https://expressjs.com/).

For popularity reasons, we're going to go with Express.

However, express on its own lacks a few capabilities. Namely, it doesn't handle POST requests, nor file uploads. It also doesn't handle sessions, and won't allow requests from another domain unless we tell it to. 

Move to the `back` directory, and then:

```sh
npm install express multer express-session cookie-parser body-parser serve-favicon cors http-errors --save
```

- `express-session`: Lets Express handle sessions
- `cookie-parser`: Lets Express parse cookies sent by the browser
- `serve-favicon`: automates serving a favicon
- `cors`: Allows us to specify easily that Express should answer requests, even if from another domain
- `multer`: Lets Express read file uploads
- `http-errors`: Allows us to create relevant Javascript errors in a slightly easier way

Once everything is installed, we'll use Express in `index.js`. 

Create a file `src/app.js`, in which we'll set up everything:

```js
// back/src/app.js
import express from 'express'
import cookieParser from 'cookie-parser' // parses cookies
import session from 'express-session' // parses sessions
import favicon from 'serve-favicon' // serves favicon
import cors from 'cors' // allows cross-domain requests
import createError from 'http-errors' // better JS errors
import path from 'path'

const app = express(); // create a new app

const IS_PRODUCTION = app.get('env') === 'production'

if (IS_PRODUCTION) {
  app.set('trust proxy', 1) // secures the app if it is running behind Nginx/Apache/similar
}

app.use(cors()) // allows cross domain requests
app.use(express.json()); // allows POST requests with JSON
app.use(express.urlencoded({ extended: false })); // allows POST requests with GET-like parameters
app.use(cookieParser()); // Parses cookies
app.use(favicon(path.join(__dirname, '../public', 'favicon.ico'))) // <-- location of your favicon
app.use(express.static(path.join(__dirname, '../public'))); // <-- location of your public dir

app.use(session({ // handles sessions
  secret: 'keyboard cat', // <-- this should be a secret phrase
  cookie: { secure: IS_PRODUCTION }, // <-- secure only in production
  resave: true,
  saveUninitialized: true
}))


export default app
```

You notice we haven't used `multer`, the file upload plugin. That's because we will want to use it on a per-route level.
You will need to create a directory `public` next to `src`, and store in it `favicon.ico`. You can download a favicon [here](https://www.freefavicon.com/freefavicons/objects/) or get the codi favicon from [there](https://codi.tech/wp-content/themes/wp-codi/images/favicon.png). If you use a png, don't forget to change the path in your application.

Let's import this file in `index.js`, and use it instead of the `http` module:

```js
// back/src/index.js
import app from './app'

app.get( '/', (req, res) => res.send("ok") );

app.listen( 8080, () => console.log('server listening on port 8080') )
```

We can test that everything works by running `npm start`, or, from the root, `npm run back`.

