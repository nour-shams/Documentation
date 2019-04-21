# Styling

## Placing Classes

Let's first put the classes we might need everywhere we might need them.

Obviously, our contact link is currently very simple, compared to the layout above. Let's replace it with this new file:

```js
// front/stc/ContactLink.js
import React from 'react'
import { Link } from "react-router-dom";

const ContactLink = ({ id, name, email, image, style }) => (
  <div className="contact-link" style={style}>
    {image ? (
      <img
        className="contact-link__avatar-image"
        src={`//localhost:8080/images/${image}`}
        alt={`the avatar of ${name}`}
      />
    ) : (
      <div className="contact-link__avatar-letter">
        <span>{name[0].toUpperCase()}</span>
      </div>
    )}
    <Link className="contact-link__text" to={"/contact/" + id}>
      <span className="contact-link__text__name">{name}</span>
      <span className="contact-link__text__email">{email}</span>
    </Link>
  </div>
);

export default ContactLink
```

then replace the previous link in `ContactList.js` (and also add a `contact-list` wrapper):

```js
// front/src/ContactList.js
...
import ContactLink from './ContactLink'

const ContactList = ({ contacts_list }) => (
  <div className="contact-list">
    <Transition
      ...
    >
      {contact => style => <ContactLink style={style} {...contact} />}
    </Transition>
  </div>
);
...
```

Let's give some structure to the app by putting our menu in a `header` and the rest of the page in a `body`. Also, let's add some classes to the menu:

```js
// front/src/App.js
class App extends Component {
  ...
  render() {
    return (
      <div className="App">
        <div className="header">
          <div className="main-nav">
            <Link className="main-nav__link" to="/">Home</Link>
            <Link className="main-nav__link" to="/profile">profile</Link>
            <IfAuthenticated>
              <Link className="main-nav__link" to="/create">create</Link>
            </IfAuthenticated>
          </div>
        </div>
        <div className="body">
          {this.renderContent()}
        </div>
        <ToastContainer />
      </div>
    );
  }
  ...
}
```

We'll also add a (currently non-functional) search box at the top.

Inside `header`, but before `main-nav`, insert the following:

```js
...
  render() {
    return (
      <div className="App">
          ...
          <div className="search">
            <input className="search__input" type="text"/>
            <button className="search__button">search</button>
          </div>
          <div className="main-nav">
          ...
...
```

Finally, we'll modify `Contact.js`:

```js
// front/src/Contact.js
...
  render() {
    const { editMode } = this.state;
    return (
      <div className="contact--page">
        {editMode ? this.renderEditMode() : this.renderViewMode()}
      </div>
    );
  }
...
```

This is the structure we now have:

```jade
#App
  .header
    .search
      .search__input
      .search__button
    .main-nav
      .main-nav__link
  .body
    .contact-list
      .contact-link
        .contact-link__avatar-image
        .contact-link__avatar-letter
        .contact-link__text
          .contact-link__text__name
          .contact-link__text__email
    .contact-page
```

Open `index.css` and dump this in it:

```css
#App{}
.header{}
.search{}
.search__input{}
.search__button{}
.main-nav{}
.main-nav__link{}
.body{}
.contact-list{}
.contact-link{}
.contact-link__avatar-image{}
.contact-link__avatar-letter{}
.contact-link__text{}
.contact-link__text__name{}
.contact-link__text__email{}
.contact-page{}
```

We will probably have to intervene on the html structure again, but we have enough detail to begin styling.
