/**
 * Pop Menu - colocated overlay drop menu that pops out of scroll ancestors and traps focus
 * Copyright (c) pinkhominid <pinkhominid@birdbomb.com>
 * MIT license
 *
 * TODO
 * - overscroll-behavior not preventing scroll via keyboard
 * - Shim not preventing scroll via scrollbar thumb (macOS edge case?)
 * - Flip
 * - PreventOverflow?
 * - R&D alternative approaches
 *   - IntersectionObserver with viewport? and/or position fixed items above and below?
 *   - MutationObserver for internals changing?
 */

import '@a11y/focus-trap';

const tmpl = document.createElement('template');
tmpl.innerHTML = `
  <style>
    :host {
      display: inline-block;
    }
    :host([hidden]) {
      display: none;
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    :host([open]) #shim {
      display: block;
    }
    :host([open]) #menu-wrap {
      display: flex;
    }

    :host([justify=end]) #menu-wrap {
      justify-content: flex-end;
    }
    :host([justify=center]) #menu-wrap {
      justify-content: center;
    }

    * {
      box-sizing: border-box;
    }

    #trap {
      position: relative;
      display: block;
    }

    #shim {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      overflow: scroll;
      overscroll-behavior: contain;
      scrollbar-width: none;
      z-index: 1000;
    }
    #shim::-webkit-scrollbar {
      display: none;  /* Chrome Safari */
    }
    #shim > div {
      height: 200vh;
      width: 200vw;
    }

    #menu-wrap {
      position: absolute;
      width: 100%;
    }

    #menu {
      display: block;
      position: fixed;
      overscroll-behavior: contain;
      z-index: 1001;
    }
  </style>

  <focus-trap id=trap inactive>
    <div id=shim part=shim hidden><div></div></div>
    <slot name=trigger id=trigger></slot>
    <div id=menu-wrap part=menu-wrap hidden>
      <slot name=menu id=menu part=menu></slot>
    </div>
  </focus-trap>
`;

export class PopMenu extends HTMLElement {
  static get observedAttributes() {
    return ['disabled', 'open'];
  }

  get open() {
    return this.hasAttribute('open');
  }

  set open(val) {
    if (this.disabled) return;

    // Reflect to attribute
    if (val) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
    }

    this.dispatchEvent(new CustomEvent('toggle', { detail: { open: this.open } }));
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    // Reflect to attribute
    if (val) {
      this.open = false;
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  constructor() {
    super();

    const shadowRoot = this.attachShadow({mode: 'open'});
    shadowRoot.appendChild(tmpl.content.cloneNode(true));

    this.__opening = false;
    this.__trap = shadowRoot.getElementById('trap');
    this.__trigger = shadowRoot.getElementById('trigger');
    this.__menuWrap = shadowRoot.getElementById('menu-wrap');
    this.__menu = shadowRoot.getElementById('menu');
    this.__shim = shadowRoot.getElementById('shim');

    this.__onTriggerClick = this.__onTriggerClick.bind(this);
    this.__onShimScroll = this.__onShimScroll.bind(this);
    this.__onShimClick = this.__onShimClick.bind(this);
  }

  connectedCallback() {
    this.__upgradeProperty('open');
    this.__upgradeProperty('disabled');

    this.__trigger.addEventListener('click', this.__onTriggerClick);
    this.__shim.addEventListener('scroll', this.__onShimScroll);
    this.__shim.addEventListener('click', this.__onShimClick);

    // initialize attributes
    this.attributeChangedCallback();
  }

  disconnectedCallback() {
    this.__trigger.removeEventListener('click', this.__onTriggerClick);
    this.__shim.removeEventListener('scroll', this.__onShimScroll);
    this.__shim.removeEventListener('click', this.__onShimClick);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      this.__trap.inactive = true;

      if (this.open) {
        this.__opening = true;

        this.__positionMenu();
        this.__trap.inactive = false;
        this.__trap.focusFirstElement();

        // giving some scroll slack helps it feel more responsive
        this.__shim.scrollTop = 100;
        this.__shim.scrollLeft = 100;
        // delay till scrollTop/Left is applied
        requestAnimationFrame(() => this.__opening = false);
      }
    }
  }

  __positionMenu() {
    const menuWrapRect = this.__menuWrap.getBoundingClientRect();
    this.__menu.style.top = menuWrapRect.top + 'px';
  }

  __upgradeProperty(prop) {
    if (this.hasOwnProperty(prop)) {
      let value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  __onTriggerClick(e) {
    this.open = !this.open;
  }

  __onShimScroll() {
    if (this.__opening) return;
    this.open = false;
  }

  __onShimClick() {
    this.open = false;
  }
}

if (self.customElements.get('pop-menu')) {
  self.console.warn(`'pop-menu' has already been defined as a custom element`);
} else {
  self.customElements.define('pop-menu', PopMenu);
}
