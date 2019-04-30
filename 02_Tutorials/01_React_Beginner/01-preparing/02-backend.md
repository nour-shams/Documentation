# Creating the back-end

create a "back" directory:

```sh
mkdir back
cd back
```

initialize an npm project in it:

```sh
npm init
```

Let's install a few modules that we'll need:

```sh
npm install --save @babel/cli @babel/core @babel/node @babel/preset-env @babel/register nodemon rimraf
```

- `@babel/x`: transforms ES6 to ES5, which Node can read
- `nodemon`: resets the app every time we save a file
- `rimraf`: cross-platform tool to remove directories

Add the following to `package.json`:

```json
// back/package.json
{
  ...
  "babel": {
    "presets": [
      "@babel/preset-env"
    ]
  },
  "scripts":{
    "start": "nodemon --exec babel-node ./src/index.js",
    "build:clean":"rimraf ./build",
    "build:build": "babel src --out-dir ./build --source-maps",
    "build": "npm run build:clean && npm run build:build",
    "production": "node ./build/index.js"
  },
  ...
}
```

We just added the scripts:

- `start`: will start the application, and re-run it every time we save a file
- `build:clean`: will remove generated files in the `./build` directory
- `build:build`: compiles ES6 to ES5 in the `./build` directory
- `build`: does both things above
- `serve`: runs the generated, production-ready, ES5 files

The "babel" key has the Babel configuration. 

Then create a directory `src` and write in it a file called `index.js`

Open `index.js` and put:


```js
/**
 * First, we import the function we need from the Node `http` library
 * This library is included by default with Node 
 **/
import { createServer } from 'http'

/**
 * This function will be used as a request handler
 * by our server. It will run for every request the server
 * receives. It will always answer "hello", with a status code
 * of 200.
 **/ 
const whenRequestReceived = (request /* the request sent by the client*/, response /* the response we use to answer*/) => {
  /**
   * We have to specify the status code (200), which means everything is ok,
   * and the content type, which tells the browser we're sending plain text.
   * Not specifying those is ok (the browser will infer them), but not 
   * correct.
   **/
  response.writeHead(200, { 'Content-type': `text/plain` });
  /**
   * We write our actual response, a text that says "hello"
   **/ 
  response.write(`Hello`);
  /**
   * We terminate the response, so the browser can close the connection.
   * As a user, we know this happens because the browser stops displaying the
   * loading spinner
   **/
  response.end( );
}

/**
 * This is our server object, created through the `createServer`
 * function provided by the `http` library.
 * We give it the `whenRequestReceived` function we wrote above so
 * any request directed at the server gets passed to this function
 **/
const server = createServer(whenRequestReceived)

/**
 * Finally, we start the server by using `listen`, and specifying
 * a port. In Node, we traditionally use the port `3000`, but since
 * we already will have something running on port 3000, we choose something 
 * else.
 **/
server.listen(8080, ()=>{console.log('ok, listening')});

```

Run it:

```sh
npm start
```

Open your browser on http://localhost:8080.  You should see "Hello". You can press <keyboard>ctrl</keyboard>+<keyboard>c</keyboard> in your terminal to stop the server.

At this point, if you want to commit, you'll commit everything in `node_modules`.

We can avoid this with a `.gitignore` file. We have one ready, created for us by `create-react-app`.  
Move `front/.gitignore` to the root, so it applies to our whole project

We're just going to make a few changes in it. Change the line

```
/node_modules
```

to

```
**/*node_modules
```

This makes it ignore *any* directory called `node_modules`, wherever it is (it previously only worked on directories exactly one node deep).

Also, change `/build` to `**/*build`
