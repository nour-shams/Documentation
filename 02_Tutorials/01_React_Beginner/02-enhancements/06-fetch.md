# Accessing the Back-End from React

We're still in `front/src/App.js`. We want these contacts to show in our React app.

Here's how it should go:

1. React loads the component
2. React initializes the component
3. React inserts the component in the page
4. React runs the component's `onComponentDidMount` method
5. React waits for user input

We're concerned by step #4. We want to load the data when the component exists, is ready for use, and has been inserted in the page.

Let's try. Inside the component, you'll add a `componentDidMount` method, in which you will try to load the contacts, and add them to the component's `state`:

```js
...
class App extends React.Component {
  state = { contacts_list:"" }
  componentDidMount(){
    const getList = async()=>{
        const response = await fetch('//localhost:8080/contacts/list')
        const text = await response.text()
        this.setState({contacts_list:text})
    }
    getList();
  }
  render() {
    ...
  }
}
...
```

Open the react dev tools in your inspector, and drill down the components until you reach your `App` component. Check out the state, and verify it is, actually, getting filled with the contacts it is loading from the back-end.

Let's now show those contacts in the generated html.

Add something to show the contacts to the `render` function:

```js
...
class App extends React.Component {
  render() {
    const { contacts_list } = this.state
    return (
      ... previous stuff
      // if using react-native-web
      <Text style={styles.text}>{contacts_list}</Text>
      // otherwise:
      <p>{contacts_list}</p>
      ...
    );
  }
}
...
```

Save, and verify React is actually displaying the contacts.