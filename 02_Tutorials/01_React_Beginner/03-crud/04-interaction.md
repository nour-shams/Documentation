# Interaction and Feedback

We have a full CRUD, front-end and back-end, but we're missing a crucial thing: feedback.

There are three major ways we're going to add feedback to our application:

1. Loading spinners: when something needs some time, we need to display something
2. Animations: when things change, we should be able to see the change thanks to clear visual changes
3. Notifications: when a form is submit, we want to know. When an error is received, we want to know too

Let's begin with the first: loading spinners.


## Slow Database Calls

We're going to need a few things:

1. Artificially slow down the calls to the database, to simulate network load
2. Decide when to show this spinner 

First, we're going to create a function `sleep`, which will wait a bit before resuming.

Here's the code for it:

```js
const sleep = (ms) => new Promise( ok => setTimeout(ok, ms))
// you could use it like this:
await sleep(3000)
console.log('3 seconds have passed')
```

I will not explain the syntax here; it's out of the scope of this exercise's theme, and not very interesting.

Once that's done, we can also create a function that chooses a random number

```js
const getRandomInteger = (max, min=0) => Math.floor(Math.random() * (max - min + 1)) + min
```

We can then combine the two to get a random pause time. The following pauses for a random time between a second and four

```js
sleep(getRandomInteger(1000,4000))
```

We can make a shortcut for this:

```js
const pause = () => sleep(getRandomInteger(1000,4000))
```

We will create a file, `utils.js`, to store those little functions:

```js
// front/src/utils.js
export const sleep = (ms) => new Promise( ok => setTimeout(ok, ms))
export const getRandomInteger = (max, min=0) => Math.floor(Math.random() * (max - min + 1)) + min
export const pause = () => sleep(getRandomInteger(1000,4000))
```

Notice, we are *not* using `export default`. We are using "named exports". To import each of these functions, we'll need to import it by name.

For example:

```js
import { sleep, pause } from 'utils.js'
```

However, the below:

```js
import pause from 'utils.js'
```

...will not work, since we are not exporting a `default`.

You can now import it sprinkle it everywhere you have a `fetch`:

```js
// front/src/App.js
...
import { pause } from './utils.js'
...
  getContactsList = async order => {
    const response = await fetch(`http://localhost:8080/contacts/list?order=${order}`);
    await pause()
    const answer = await response.json();
  ...      
```

If you try the app now, you will see interactions take time (don't forget to remove those later!).

You could also use the developper's tools of Chrome or Firefox to throttle the connection, but this is sometimes faster and simpler to set up. It also doesn't depend on dev tools being open.

## Loading State

That gives us occasion to display something while loadings occur.

To do this, we'd need to have a switch in `state` for when things are loading and when they are not.

Here's how it is going to work:

1. An `isLoading` key in `state`, set to `false`
2. Before beginning to load, this `isLoading` will be set to `true`
3. When the loading finishes, set this `isLoading` key back to `false`

```js
// front/src/App.js
...
state = { contacts_list: [], error_message: "", isLoading:false };
...
```

Here's an example of how every `fetch` function should work from now on:

```js
...
  SOME_FUNCTION = async () => {
    // SET LOADING TO TRUE:
    this.setState({ isLoading:true })
    // RUN THE FUNCTION
    const response = await fetch(`http://localhost:8080/contacts/list?order=${order}`);
    await pause()
    const answer = await response.json();
    if (answer.success) {
      const contacts_list = answer.result;
      this.setState({ contacts_list, isLoading:false }); // SUCCESS, SET LOADING TO FALSE
    } else {
      this.setState({ error_message: answer.message, isLoading:false }); // ERROR, ALSO SET LOADING TO FALSE
    }
  }
...
```

Recap:

set `isLoading` to true -> then load -> then set `isLoading` to false.

**note**: Why did we call this `isLoading` and not `loading` or `load` or anything else? Because `load`, for example, might be an action. `loading` might look like the `<Loading/>` component we might create later. However, `isLoading` is the least ambiguous. **always choose unambiguous variable names**.

Let's first implement that in the `getContactsList` method:

```js
...
  getContactsList = async order => {
    this.setState({ isLoading:true })
    try {
      const response = await fetch(`http://localhost:8080/contacts/list?order=${order}`);
      await pause()
      const answer = await response.json();
      if (answer.success) {
        const contacts_list = answer.result;
        this.setState({ contacts_list, isLoading:false });
      } else {
        this.setState({ error_message: answer.message, isLoading: false });
      }
    } catch (err) {
      this.setState({ error_message: err.message, isLoading: false });
    }
  }
...
```

We can now reflect that in the `render` function. If `isLoading` is true, we will show "loading...". If not, we will show the list:

```js
// front/src/App.js
...
  render(){
    const { contacts_list, error_message, isLoading } = this.state;
  ...
  { isLoading ? (
    <p>loading...</p>
  ) : (
    contacts_list.map(contact => (
      <Contact
        key={contact.id}
        id={contact.id}
        name={contact.name}
        email={contact.email}
        updateContact={this.updateContact}
        deleteContact={this.deleteContact}
      />
    ))
  )}
...
```

Later, we can replace this "loading" thing with a spinner, an animation, or whatever else makes sense.

## Animations

One more thing: we want animations when things get added or removed.

We will use [react-spring](http://react-spring.surge.sh/). Performance is very high, usage is (relatively) simple, and it is well documented.

go to `front`, and:

```sh
npm install --save react-spring
```

The way you use this is thus:

```js
import { Transition } from 'react-spring'

// ..then
<Transition
  items={items}
  keys={item => item.key}
  from={{ transform: 'translate3d(0,-40px,0)' }}
  enter={{ transform: 'translate3d(0,0px,0)' }}
  leave={{ transform: 'translate3d(0,-40px,0)' }}>
  {item => style =>
    <div style={style}>{item.text}</div>
  }
</Transition>
```

It is, at first sight, very complex; however it's merely difficult to read. Here are the properties needed

1. `items`: a list of something. In our case, it's going to be `contacts_list`
2. `key`: a function that returns keys. In our case, it'll return the contact's `id`
3. `from`, `enter`, `leave`: styles for different stage of transition of the item
4. `item => style => <Element>`: a function that returns a React element. `props` represents the style that `react-spring` creates

In our case, it will look something like:

```js
// front/src/App.js
...
import { Transition } from 'react-spring'
...
        {isLoading ? (
          <p>loading...</p>
        ) : (
          <Transition
            items={contacts_list}
            keys={contact => contact.id}
            from={{ transform: "translate3d(-100px,0,0)" }}
            enter={{ transform: "translate3d(0,0px,0)" }}
            leave={{ transform: "translate3d(-100px,0,0)" }}
          >
            {contact => style => (
              <div style={style}>
                <Contact
                  key={contact.id}
                  id={contact.id}
                  name={contact.name}
                  email={contact.email}
                  updateContact={this.updateContact}
                  deleteContact={this.deleteContact}
                  />
              </div>
            )}
          </Transition>
        )}
...
```

Refresh, test, when the list of contacts load, you can see them sliding in nicely! Delete one, see how it also works smoothly.

## Notifications

If you're using `react-native-web`, you should rely on native notifications (not described here), but on the web, we will have to make use in-app alerts (we also *could* use the native notification API of browsers, but we'd need to get user permissions).

At first sight, it's not too difficult to make our own. A notification is something that:

1. is absolutely positioned
2. is dismissed when "close" is clicked
3. disappears on its own after some time

But if we think about it a bit more, we uncover that:

1. we need animations for entry and exit
2. we need to stack messages if there are more than one
3. we need to add icons and styles
4. some messages might need buttons with specific interactions
5. we might want some messages to not disappear until a user dismisses them
6. we might want some messages to not disappear at all ("you are currently offline"...)
6. ...

Fortunately, there are many read-made libraries. I like [react-toastify](https://github.com/fkhadra/react-toastify), so this is what we'll use:

Install it. Move to `front`, and

```sh
npm install --save react-toastify
```

Then, import it in `App.js`. We need to import three things:

1. `<ToastContainer/>`, which will contain all our notifications. We need to use it once, in our main app
2. the toastify css file, so the styles can be applied. This also just needs to be imported once
3. the `toast` function, which creates a toast. 

```js
// front/src/App.js
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
...
class App extends Component {
  render(){
    return (
      ...
        <ToastContainer />
      ...
    )
  }
}
```

We can now call `toast("a message")` anywhere we want. We can try this:


```js
// front/src/App.js
...
  getContactsList = async order => {
    this.setState({ isLoading: true });
    try {
      const response = await fetch(
        `http://localhost:8080/contacts/list?order=${order}`
      );
      await pause();
      const answer = await response.json();
      if (answer.success) {
        const contacts_list = answer.result;
        this.setState({ contacts_list, isLoading: false });
        toast("contacts loaded"); // <--- Show a toaster
      } else {
        this.setState({ error_message: answer.message, isLoading: false });
        toast.error(answer.message); // <--- show a toaster
      }
    } catch (err) {
      this.setState({ error_message: err.message, isLoading: false });
      toast.error(err.message); // <--- show a toaster
    }
  };
...
```

Refresh, you should see a "contacts loaded" message.

**Note:** 
> You have to apply the same to **every** other **CRUD** Method
> 1. createContact
> 2. updateContact
> 3. deleteContact
> 4. getContact

Once you're done, remove the error message from `render`, as it is not needed there anymore.
```js
{error_message ? <p> ERROR! {error_message}</p> : false}
```


[react-toastify ](https://github.com/fkhadra/react-toastify) has a lot of customization options, so do check it out.

It uses its own animation system, so, of course, by using it, you're duplicating parts of what your css and `react-spring` are doing, so if you want to keep your dependencies low and implement your own toast system, this [codesandbox](https://codesandbox.io/s/rw1ymrlpvq) is a good starting point. 

## TODO

1. Display a loading spinner instead of a "loading..." text
