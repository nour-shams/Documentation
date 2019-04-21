# General layout

First, we will create:
  - a grid system
  - some utility classes such as [the media element](http://www.stubbornella.org/content/2010/06/25/the-media-object-saves-hundreds-of-lines-of-code/ ), and a loading spinner

## Planning

We need:
  - one element that prevents the site from growing too much on large screens. We'll call that a `.wrapper`.
    - `.wrapper` will limit of wide the website can grow
  - one element that creates columns inside of itself and distributes the elements. We'll call that `.container`
    - `.container` will use `flex` to distribute items in columns
  - we'll also have a `.container-wrapper`, which will do both
    - we often will have items that should have limited width, but also internal columns
  - we'll have some pre-defined columns sizes
    - items inside `.container` will use as much space as they can, but we will have classes like `col-1`, `col-2` and so on, which we can use to precisely set the width of columns with 

The wrapper part is ridiculously easy:

```css
.wrapper{
  width:320px;
  margin:0 auto;
}
```

That's it. We will add rules to resize it later, for now, we're good. Let's move onto the grid.

We will use a mix of `CSS Grid` and `Flexbox` to achieve our goals.

Flexbox which is not [supported by all browsers](https://caniuse.com/#feat=flexbox), but still supported by *95%* of browsers out there.

CSS Grid is [not really well supported](https://caniuse.com/#feat=css-grid), only *85%* of browsers, so we'll figure out a fallback

We will experiment with both to get a good idea of the layout we want to achieve before actually applying it. The order doesn't matter, so pick if you prefer to start with [the CSS Grid Tutorial](./Grid.md) or [the FlexBox Tutorial]('./Flex.md).

**note**: there is no reason why we need both. We could probably achieve similar results with one technique only, or even none at all (`float:left` can do a lot). We are mixing them up for fun and profit.