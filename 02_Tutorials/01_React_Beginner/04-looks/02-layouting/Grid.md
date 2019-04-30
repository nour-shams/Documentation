# Grid

We will inspire ourselves from [Grid By Example](https://gridbyexample.com)

On mobile, we just have rows. But on larger screens, we want to be able to get something like

![A responsive, two column layout with a header and footer](https://gridbyexample.com/img/pattern1.png)

The beauty of not needing CSS Grid on mobile is that we can simply use the same layout on all browsers that don't support CSS Grid. Our fallbak is all ready.

Let's begin with mobile. We will not use CSS Grid at all.

## No Grid At All

Look at this HTML structure:

<p data-height="265" data-theme-id="0" data-slug-hash="yGeOaN" data-default-tab="html,result" data-user="Xananax" data-pen-title="yGeOaN" class="codepen">See the Pen [Simple Structure Without CSS](https://codepen.io/Xananax/pen/yGeOaN/) on [CodePen](https://codepen.io)</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

Look at the CSS. You will notice something interesting: **there is no CSS**

You should strive for structures that work without CSS. If your html is semantic and readable, it means it:

- Will work on the oldest browsers (the above probably works in [NCSA Mosaic](https://en.wikipedia.org/wiki/Mosaic_(web_browser)))
- Will work for people who use assistant devices (disabled and invalid people)
- Will work if the connection is slow and CSS doesn't load
- Will be read correctly by aggregators and search engines

**note**: notice how I named my footer `section-info` instead of `footer`. That is, it will not necessarily be at the bottom of my website. On some screens, it might be somewhere else. For that reason, it is preferable to give it a *semantic* name, which relates to its function, rather than where it currently is.

Let's add just a few rules to make the whole thing more palatable:

1 - Remove the bullets:

```scss
[class^="menu"] > ul, [class^="menu"] li{
  list-style:none;
  padding:0
}
// since we're using scss, this can be re-written as:
[class^="menu"]{
  & > ul, & li{
    list-style:none;
    padding:0
  }
}
```

2 - Arrange the items in the header to go next to each other:

```scss
.brand h2, .action-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
}
```

3 - Move the menu to the left:

```scss
.section-navigation{
  display: block;
  position: fixed;
  margin:0;
  top: 0;
  left: 0;
  bottom: 0;
  background: #eee;
  padding: 2rem;
  box-shadow: 3px 3px 4px rgba(0,0,0,.2)
}
```

4 - Give a bit of space to the media items

```scss
.media{
  margin-top:1em;
  padding-bottom:2.5em;
}
```

Make forms look slightly nicer 

```scss
input, textarea, button{
  padding:.3em;
  margin-top:.4em;
  border:0;
  line-height:1;
  box-sizing: border-box;
  font-size:1.2em;
}

input, textarea{
  width:100%;
}

fieldset{
  border:0;
  padding:0;
}

textarea{
  height:8em;
}
```

Finally, let's give some icons to those buttons:

```scss

.button-create::before{ content:"✎"}

.button-filter::before{content:"🔦"}

.button-contact::before{content:"📩"}

// and remove the text:
[class^="button-"] span{ display:none;}
```

Lastly, we'll add the grid rules, even though they won't visually do anything for the moment:

First, we name where we want our sections to be:
```scss
.section-brand{ grid-area: b; }
.section-content{ grid-area: c; }
.section-info{ grid-area: i; }
```

Then, we place them in the grid

```scss
.wrapper{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: minmax(100px, auto);
    grid-template-areas: 
      "b b b b"
      "c c c c"
      "i i i i";
}
```

And here is the result:

<p data-height="265" data-theme-id="0" data-slug-hash="WLrGPL" data-default-tab="css,result" data-user="Xananax" data-pen-title="Simple Structure With Just a Bit of CSS" class="codepen">See the Pen [Simple Structure With Just a Bit of CSS](https://codepen.io/Xananax/pen/WLrGPL?editors=1100/) on [CodePen](https://codepen.io)</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

## A Little Bit of Grid

With minimal styling and without any sort of layout, we have a website that works everywhere (albeit looks really small on anything larger than a mobile phone)

Let's just change the layout for larger devices:

```scss
@media (min-width: 36em){ .wrapper{  width:36em; }}

@media (min-width: 48em){
   .wrapper{ 
      width:48em;
      grid-template-areas: 
        "c c c b"
        "c c c b"
        "c c c i";
  }
}
```

And there we have it!


<p data-height="265" data-theme-id="0" data-slug-hash="RERoyx" data-default-tab="result" data-user="Xananax" data-pen-title="Basic Grid Rules" class="codepen">See the Pen <a href="https://codepen.io/Xananax/pen/RERoyx/">Basic Grid Rules</a> on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://static.codepen.io/assets/embed/ei.js"></script>

Our final CSS looks something like this:

```scss
[class^="menu"]{
  & > ul, & li{
    list-style:none;
    padding:0
  }
}

.section-brand h2, .action-bar{
  display:flex;
  align-items:center;
  justify-content:space-between;
}

.section-navigation{
  display: block;
  position: fixed;
  margin:0;
  top: 0;
  left: 0;
  bottom: 0;
  background: #eee;
  padding: 2rem;
  box-shadow: 3px 3px 4px rgba(0,0,0,.2)
}

.media{
  margin-top:1em;
  padding-bottom:2.5em;
}

input, textarea, button{
  padding:.3em;
  margin-top:.4em;
  border:0;
  line-height:1;
  box-sizing: border-box;
  font-size:1.2em;
}

input, textarea{
  width:100%;
}

fieldset{
  border:0;
  padding:0;
}

textarea{
  height:8em;
}

.button-create::before{ content:"✎"}

.button-filter::before{content:"🔦"}

.button-contact::before{content:"📩"}

[class^="button-"] span{ display:none;}

.section-brand{ grid-area: b; }
.section-content{ grid-area: c; }
.section-info{ grid-area: i; }

.wrapper{
  width:320px;
  margin:0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(100px, auto);
  grid-template-areas: 
    "b b b b"
    "c c c c"
    "i i i i";
}

@media (min-width: 36em){ .wrapper{  width:36em; }}

@media (min-width: 48em){
  .wrapper{ 
      width:48em;
      grid-template-areas: 
        "c c c b"
        "c c c b"
        "c c c i";
  }
}
```