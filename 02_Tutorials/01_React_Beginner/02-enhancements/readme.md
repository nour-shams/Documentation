# TWEAKS AND ENHANCEMENTS

We're going to make a few adjustments to our setup, which will help us build things faster; of course, this means the setup will be less generic, and less reusable, but more precisely tuned for what we want to build. 

First, we'll make the front-end a bit easier to work with:

1. [Add a front-end helper framework](./01-0-styling-react).

Then, we are going to make a database, accessible from URLs:

2. [Add a Request Handler for the back end](./02-request-handler): We will use express to handle every request to the server 
3. [Add SQLite](./03-sqlite): SQLite is the database that will hold our data
4. [Add a Controller](./04-controller): the controller will take care of simplifying and abstracting the database calls
5. [Add Routes to Express](./05-REST): express will have routes mapping to the controller's functions, so the controller can be accessed from outside
6. [Access the routes from React](./07-fetch), in which we will link the front-end
7. [Make the Controller answer with JSON](./06-json): Until now, our response were plain text. We will change it so we send structured data
8. [RECAP](./99-recap)
