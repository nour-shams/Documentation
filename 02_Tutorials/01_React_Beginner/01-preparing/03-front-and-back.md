# Linking Backend and Frontend together

We will now synchronize the `front` and `back` parts so we can run both at the same time

First, create a new npm project in the root:

```sh
npm init -y
```

(the `-y` avoids questions)

Now, let's install a few modules we'll need:

```sh
npm install --save concurrently
```

`concurrently` will allow us to run multiple softwares at the same time. In this instance, we will be using it to run the `front` and `back` javascript apps at the same time.

Open package.json, locate the scripts objects, and add:

```json
// package.json
{
  ...
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "back": "cd back && npm start",
    "front": "cd front && npm start",
    "start": "concurrently --kill-others-on-fail --names \"back,front\" \"npm run back\" \"npm run front\""
  },
 ...
}
```

We created three new script:

- `npm run front`: will run create-react-app (without having to go to its directory)
- `npm run back`: will run the server (without having to go to its directory)
- `npm start`: will run both.

Just one more thing to do so everything works nicely: make npm install install all required modules, in all three directories (main one, front, and back).
open `package.json` again,  locate "scripts", and add:

```json
{
  ...
  "scripts": {
    ...
    "postinstall":"cd front && npm install && cd .. && cd back && npm install"
  },
 ...
}
```

`postinstall` is a special kind of script name; you can run it with `npm run postinstall` like every other script, but it also automatically run after `npm install` runs. In other words, simply running `npm install` will download the modules required by the root, then the front, then the back.