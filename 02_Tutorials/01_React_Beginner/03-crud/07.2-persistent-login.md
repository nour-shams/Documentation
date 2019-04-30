# Persistent Login

In order to remember a user between sessions, we're going to have to set a mechanism somehow.

Usually, when a page load, the browser sends the token it has to the server, which then answers by telling the browser if the token is valid or not. A similar mechanism is implemented by Auth0.

First, we'll have to add a few methods to `auth.js` in `front`:

```js
// front/src/auth.js
...
export const handleAuthentication = async () => {
  return new Promise((resolve, reject) => {
    auth0Client.parseHash((err, authResult) => {
      if (err){ return reject(err);}
      if(!authResult || !authResult.idToken){ return reject(new Error('user was not registered'))}
      // we removed three lines and moved them to 
      // `setSession` below
      setSession(authResult) // <------------ We added this line
      resolve(profile);
    });
  });
}
...
/**
 * Extracts the main items out of the result of an Auth0 authentication
 * and saves them in memory
 * @param {Object} authResult the Object returned by Auth0 
 */
export const setSession = (authResult) => {
  idToken = authResult.idToken;
  profile = authResult.idTokenPayload;
  // set the time that the id token will expire at
  expiresAt = authResult.idTokenPayload.exp * 1000;
}
...
export const signOut = ()  => {
  idToken = null;
  profile = null;
  expiresAt = null;
  auth0Client.logout({
    returnTo: 'http://localhost:3000',
    clientID: AUTH0_CLIENT_ID,
  });
}
...
/**
 * Checks if the current user had a valid sessions before
 * browser refresh.
 * If yes, silently logins the user
 */
export const silentAuth = () => {
  return new Promise((resolve, reject) => {
    auth0Client.checkSession({}, (err, authResult) => {
      if (err){
        return reject(err);
      }
      setSession(authResult);
      resolve(profile);
    });
  });
}
```

We now have a `silentAuth` that can check for us if the user is logged in. All we have to do is set it to run as soon as our app loads.

Let's do that. Replace the previous `componentDidMount` with:

```js
// front/src/App.js
...
class App extends Component{
    async componentDidMount() {
      if (this.props.location.pathname === '/callback'){
        return
      }
      try {
        await auth0Client.silentAuth();
        await this.getPersonalPageData(); // get the data from our server
        this.forceUpdate();
      } catch (err) {
        if (err.error !== 'login_required'){
          console.log(err.error);
        }
      }
      this.getContactsList();
    }
    ...
}
```

Finally, do the following in your Auth0 panel:

For starters, you will have to go to [the *Applications* section in your Auth0 dashboard](https://manage.auth0.com/#/applications), open the application that represents your React app, and change two fields:

- *Allowed Web Origins*: As your app is going to issue an AJAX request to Auth0, you will need to add `http://localhost:3000` to this field. Without this value there, Auth0 would deny any AJAX request coming from your app.
- *Allowed Logout URLs*: To enable users to end their session at Auth0, you will have to call the [logout endpoint](https://auth0.com/docs/logout#log-out-a-user). Similarly to the authorization endpoint, the log out endpoint only redirects users to whitelisted URLs after the process. As such, you will have to add `http://localhost:3000` in this field too.

**note** to use Google Authentication, you'll have to set it up. It was working until now because Auth0 provides you with temporary Google keys to help you get started fast. But Aut0 doesn't allow silent authentication without entering your own Google keys.

To change these keys, move to the [Social Connections on your dashboard](https://manage.auth0.com/#/connections/social), and click on Google. There, you will see two fields among other things: *Client ID* and *Client Secret*. This is where you will insert your keys. To get your keys, please, read [the Connect your app to Google documentation provided by Auth0](https://auth0.com/docs/connections/social/google).

In the meantime, we can still use normal email and password logins.

Try it, sign in the app using email and password, then refresh. You should be still logged in.

One last problem: When you refresh, for a moment, you will see the app in a signed out state, until the `silentAuth` kicks in. Let's have three states:

1. checking the session: set "checking session" to on, while loading silentAuth
2. silentAuth finishes, set "checking session" off.
  1. silentAuth works, user is logged in
  2. silentAuth didn't work, user is not logged in

Let's add a prop to the app's `state`:

```js
// front/src/App.js
class App extends Component{
  state={
    // token:null, <- Remove the previous authentification system
    // nick:null  <- Remove the previous authentification system
    ...
    checkingSession:true // <- We will add this instead
  }
  ...
  async componentDidMount() {
    this.getContactsList() // <--- make sure this is at the top
    if (this.props.location.pathname === '/callback') {
      this.setState({checkingSession:false}); // <--- We Add this 
      return;
    }
    ...
    this.setState({checkingSession:false}); // <--- And this make sure this is after and outside the catch
  }
  renderProfilePage = () => {
    if(this.state.checkingSession){
      return <p>validating session...</p>
    }
    ...
    return ...
  }
}
```

Congrats, you have a production-grade login system! In the [next section](../08-database-modelling/readme.md), we'll explore how to provide users with exclusive content.