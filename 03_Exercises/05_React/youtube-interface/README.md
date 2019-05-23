# React & API Exercise

## Goal:

- Learn how to read documentation
- Get introduced to React

## References

- Youtube API documentation: https://developers.google.com/youtube/v3/docs/
- Create React app: https://facebook.github.io/create-react-app/docs/getting-started
- React Step 1: https://reactjs.org/docs/hello-world.html
- React an example that you could hack [CodeSandbox](https://codesandbox.io/s/441z8w4n4)

## Tasks:

1. Read, read and read.
1. Read all the exercise before starting
1. Implement the style depicted in [youtube.com.png](youtube.com.png). Try to get as close as possible you can using Bootstrap or Material UI.
1. Give the user the auto suggest option when typing in the search box.
1. When a user selects a video from the search list, display that video plus 20 related videos.
1. When a user clicks the enter button on the search box, render the first video from the search result.


## How To

### 1 - Preparing:

1. Go to your submission folder. Exercises > React > Youtube Interface.
1. Open the terminal inside the `Youtube Interface` directory.
1. Run `npm install` inside the terminal.
1. To start the react application run `npm run start` inside the terminal.

### 2 - Read & prepare to use Youtube API documentation

1. You don't know about API ? [>> click me <<](http://bit.ly/2K0xuNw)
1. Before starting follow the instructions that are available [here](https://developers.google.com/youtube/v3/getting-started)
1. Give a quick eye on whats can be done using Youtube API [check here](https://developers.google.com/youtube/v3/docs/)


### 3 - Implement Youtube Style:

1. You can use Material UI Library [here](https://material-ui.com/).
1. Inside the `src/App.css` add your CSS.
1. inside `src/App.js`, `import 'App.css'` is used to include the App.css rules. ('Try not to delete it')
1. When you're done, commit.

<kbd>🔑x150</kbd>

### 4 - Implement youtube API:

1. *note*: You CANNOT do this step without a previous commit.
1. Add an API call to auto-suggest list of videos when you enter a keyword inside the search bar.
1. Add an API call to get the first 20 result of the search result.
1. When you press enter on the search bar the following should happen:
    1. List the 20 videos on the right of the page, under `Up next`.
    1. Add an API call to render the first video from the 20 results above.
    1. List the video information under the video as per the structure available in [youtube.com.png](youtube.com.png).
1. When you're done, commit.

<kbd>🔑x350</kbd>

### Notes:

1. Don't panic! One step at a time.
1. Don't forget to push back changes from time to time (`git add -A`, then `git commit -m "message"` then `git push -u origin master`).
1. When you're satisfied, submit a *Pull Request* on github.
1. You don't need to follow the structure of the react example in [CodeSandbox](https://codesandbox.io/s/441z8w4n4).
1. Know what is react by hacking what's already available inside the [codeSandbox](https://codesandbox.io/s/ilzs7)
1. **Note** You CANNOT use any library that simplifies the API communication with YouTube.
