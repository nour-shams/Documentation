# React Routing

Now that we have a kinda-ish working app, we're going to add front-end routing. The process for routing on the front-end is relatively simple: There are two independent processes, working together.

Firstly, we have components changing the url. This is different than regular links. Regular links do a server request. Those components just change the url, without asking the server anything

Secondly, we have a set of rules that say "if the url is `/home`, show such and such component.

And that's it!

It's relatively trivial to implement by yourself, but most people still opt to use a ready made library, because there are a lot of little edge cases that can be difficult to handle.

I personally love [reach-router](https://reach.tech/router), but for the sake of conformism, because it's the most used library, we'll use [react-router](https://reacttraining.com/react-router/web/guides/quick-start). `reach-router` is accessible (ready for blind people), smaller, and simpler, but `react-router` has more examples, works with `react-native`, and has plugins for handling advanced behaviors.

So, `react-router` it is!

What we'll do:

1. install and import `react-router`
2. split our current app in 3 pages
  1. the list page (home)
  2. a single contact page
  3. a profile page

Move to the `front` directory:

```sh
npm install --save react-router-dom
```

Then, let's create a few pages.

Here's what we'll do:

1. We have our list, so that'll be our `<Home/>` component  
2. We already have our `<Contact/>` component, so we'll use that for the single contact page  
3. We will quickly implement a very simple profile page

Let's start.

First, let's import what we need in `index.js` and `App.js`:

- `Router` is used once in your whole application. You need to wrap your app with it, that's it.
- `Route` is going to be used to show or hide components, depending on the url. We will use it in a moment
- `Switch` is going to switch between different routes, showing only one at a time
- `Link` is for providing clickable links and buttons that change the url

```js
// front/src/index.js
...
import { BrowserRouter as Router } from "react-router-dom";
...
ReactDOM.render(<Router><App /></Router>, document.getElementById('root'));
```

```js
// front/src/App.js
...
import { withRouter, Switch, Route, Link } from "react-router-dom";
...
class App extends Component{
  ...
}
...
export default withRouter(App)
```

Our app is ready to use `react-router`.

Let's create our pages. Create a file `ContactList.js`, and put in it the following:

```js
// front/src/ContactList.js
import React from "react";
import { Transition } from "react-spring"; // you can remove this from App.js
import { Link } from "react-router-dom";

const ContactList = ({ contacts_list }) => (
  <Transition
    items={contacts_list}
    keys={contact => contact.id}
    from={{ transform: "translate3d(-100px,0,0)" }}
    enter={{ transform: "translate3d(0,0px,0)" }}
    leave={{ transform: "translate3d(-100px,0,0)" }}
  >
    { contact => style => (
      <div style={style}>
        <Link to={"/contact/"+contact.id}>{contact.name}</Link>
      </div>
    )}
  </Transition>
);

export default ContactList
```

create three new functions in `App.js`:

```js
// front/src/App.js
...
import ContactList from "./ContactList";
...
class App extends Component{
  ...
  renderHomePage = () => {
    const { contacts_list } = this.state;
    return <ContactList contacts_list={contacts_list} />;
  }
  renderContactPage = ({ match }) => {
    const id = match.params.id;
    // find the contact:
    const contact = this.state.contacts_list.find(contact => contact.id === parseInt(id));
    // we use double equality because our ids are numbers, and the id provided by the router is a string
    if (!contact) {
      return <div>{id} not found</div>;
    }
    return (
      <Contact
        id={contact.id}
        name={contact.name}
        email={contact.email}
        updateContact={this.updateContact}
        deleteContact={this.deleteContact}
      />
    );
  }
  renderProfilePage = () => {
    return <div>profile page</div>;
  }
  renderCreateForm = () => {
    return ... the form that was previously in `render`
  }
  renderContent() {
    if (this.state.isLoading) {
      return <p>loading...</p>;
    }
    return (
      <Switch>
        <Route path="/" exact render={this.renderHomePage} />
        <Route path="/contact/:id" render={this.renderContactPage} />
        <Route path="/profile" render={this.renderProfilePage} />
        <Route path="/create" render={this.renderCreateForm} />
        <Route render={()=><div>not found!</div>}/>
      </Switch>
    );
  }
  ...
}
```

We now have four routes, each rendering something different, plus a last one, which will activate if none of the others match

Change the render to use the `renderContent`:

```js
// front/src/App.js
...
  render() {
    return (
     
        <div className="App">
          <div>
              <Link to="/">Home</Link> | 
              <Link to="/profile">profile</Link> | 
              <Link to="/create">create</Link> 
          </div>
          {this.renderContent()}
          <ToastContainer />
        </div>
      
    );
  }
...
```

Reload your app, and each contact is now replaced with a link. If you click those links, you will load the appropriate contact.

**note**: You **do not** have to use the `<Link/>` component. If you manually change the URL, `react-router` will *still work*. `<Link/>` is a second, independent component, who's whole purpose is to change the URL. It can be used with or without the rest of `react-router`. 

Let's clean a bit, so we remove the warnings:

- remove `import { Transition } from "react-spring";`, since we don't use it anymore in `App.js`
- add the following comment: `// eslint-disable-next-line eqeqeq` right before where you used a double equal
- If you have any additional warnings, now is a good time to take care of those too.

You will notice that there are some UX problems. For example, if you create a contact, it will put out a little toaster, but not bring you back to the list. It would be nice if it did.

There's one way to use `react-router` programmatically, it's by using the `history` object. For example `history.push("/home")` would navigate to the `/home` url. *However*, this history object is only provided to things inside of `<Route/>` components.

Save, refresh. try entering a new contact, you'll see that you are brought back to the home page.

**note**: any component or function rendered inside a `<Route/>` is going to receive two objects:

- `match`: which itself contains `url`, and `params` (`url` is the current url and `params` is whatever parameters you specified in your route)
- `history`: an object that controls the browser's history. You will mainly use `history.push`, as you did above