## Testing

Of course, we need to set up some unit testing. We will not create tests right now, but we will setup the environment so tests are possible.

For the front-end, this is all set for us by `create-react-app`. You can check that, just go to the `front` directory, run 

```sh
npm test
```
And you will see the result right away.

**note** If you use `react-native-web`, read [how to set it up](./react-native-web-setup.md)

Now, let's take care of the back-end. There are many testing libraries to choose from, but `create-react-app` have decided on `jest`. For consistency, we will use that on the back-end too. Move to the `back` directory.

```sh
npm install --save-dev jest babel-jest babel-core@^7.0.0-bridge.0 regenerator-runtime
```

It would be nice if we could just install jest, unfortunately, it doesn't really work (see the issue [here](https://github.com/facebook/jest/issues/6913)), so we have to install that bridge thing.

add the script to `package.json`:

```json
{ ...
  "scripts":{
    ...
    "test":"jest"
  }
}
```

let's create two files, just to make sure things work (we can remove them later)

```js
// src/sum.js
export default (a, b) => a+b
```

```js
// src/sum.test.js
import sum from  './sum'

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
```

run

```sh
npm test
```

you can also try:

```sh
npm test -- --coverage
```

For coverage report.

You can delete those two files now, we know testing works.