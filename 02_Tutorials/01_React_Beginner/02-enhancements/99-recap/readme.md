# Recap

We have:

 - added a library (`react-native-web`) so we can have some default styling. It also allow us to use the same code on the web, and in applications
 - added a library (`nachos`) so we can have some elements looking good out of the box, instead of styling everything
 - added sqlite, and created a controller for it, which we can use from express
 - created a route `/contacts/list`, which returns a list of contacts_list
 - used `fetch` on the front-end to access that route
 - displayed the results of `fetch` in the html structure
 - made express send JSON, fetch receive JSON, and React display JSON

We are now in a place where we have all the blocks needed to create an application.

We are, of course, less flexible than we used to be, but also more ready. It would be a good moment to commit.
