# Pop Menu

Colocated overlay drop menu that pops out of scroll ancestors and traps focus.

## Install

```js
npm i @pinkhominid/pop-menu
```

## Usage

```html
<script type="module">
  import '@pinkhominid/pop-menu';
  document.querySelector('pop-menu').addEventListener('toggle', e => console.log(e.target.open));
</script>

<!-- justify=start|center|end -->
<pop-menu justify=start>
  <button slot=trigger>Pop</button>
  <ul slot=menu>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
</pop-menu>
```
