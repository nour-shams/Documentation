# Choosing a Dress for React

If I was a designer, I'd design my app, but I am not.

I will need to choose a UI library to use with React; There are [many](https://ourcodeworld.com/articles/read/497/top-10-best-ui-frameworks-for-reactjs), [many](https://hackernoon.com/23-best-react-ui-component-libraries-and-frameworks-250a81b2ac42), [many](https://www.reddit.com/r/javascript/comments/7qrcas/what_is_you_favorite_ui_framework_for_react/) options.

Three general setups are available from here

1. Using *regular css*. This is the most flexible; it is also the most repurposable. You could take a template, and convert it to JSX, and the css would just work. On the other hand, there are a few things you don't get out of the box, such as sliders, modal boxes, and so on. If you want to follow this recipe, you have nothing special to do: include a css file, use classes, and you're up and running. The catch: a lot of "css frameworks" actually use a lot of JS. You *can't* use the js part with React, unless someone has ported the logic (or you're willing to port the logic yourself).
2. Using *generated CSS*. This is interesting, because many React frameworks allow you to write css that is co-located with your code. That is, instead of having separate files, you can write the rules for the component you're currently editing. This is cool, but we also have no recipe for it. It's not significantly different from writing regular CSS though, just more (or less? depends on your point of view) organized.
3. Using a UI Kit. These are collections of pre-packaged components, that you can just drop and use. Pros: Sliders, ModalBox, and such, ready to use out of the box. Cons: you have to read and understand the rules of the kit; customization can be cumbersome. Some examples include [Blueprint](https://blueprintjs.com), [Material UI](https://material-ui.com/), [Semantic UI](https://react.semantic-ui.com/introduction), [Fabric](https://developer.microsoft.com/en-us/fabric#/components), [ReBass](https://rebassjs.org/), [Grommet](https://grommet.io/docs/components/), [ReactStrap](https://reactstrap.github.io/), and so, so many others. Each with pros and cons.
4. Using [React-Native-Web](https://necolas.github.io/react-native-web/), which *does not* provide styling, but opens the possibility to export to Android and IOS. **Warning**, this limits significantly your options and you will *have* to eject from  `create-react-app` at some point to edit the configuration files directly. Complexity, and things to keep track of will make a jump. On the other hand, you will have an app-ready setup.

In this exercise, we provide instructions for **regular css**

# Using a Good Old CSS File

Some nice options of CSS frameworks *without* javascript (you want to handle this yourself with React):

CSS Sheets:

- [Mustar UI](https://mustard-ui.com/)
- [Primer](https://primer.style/)
- [Chuck CSS](http://chuckcss.io)
- [PicNic CSS](https://picnicss.com/)
- [Pure](https://purecss.io/)
- [Min](http://mincss.com)

Some utilities frameworks

- [TailWind](https://tailwindcss.com/)
- [Tachyons](https://tachyons.io/)

Utilities frameworks are a bit different because you do not edit any css. Instead, you compose a lot of classes.
For example, a button in `Tachyon` might look like:

```html
<a class="f6 link dim br1 ph3 pv2 mb2 dib white bg-black" href="#0">Button Text</a>
```

Of course, you can abstract it to a component in React, so it's no big deal, but it is definitely a different way of approaching this

I like [Picnic](https://picnicss.com/), because it uses as little classes as possible. The styles are directly applied to html tags, such as `<p>` and `<button>`, instead of classes.

This is generally considered very bad practice, but it helps getting started fast, because you have nothing to learn. Include the css file, write your tags, you're good to go.

Picnic is very limited, which means you'll have to add a lot of styling, or switch to something else later, but it is great to not waste time making css choices.

Let's do this. Move to `front`, and

```sh
npm install picnic --save
```

Then, in `index.js`, write:

```js
// front/src/index.js
import "picnic/picnic.min.css";
```

You're done!