export const name = 'ppz-input'

export const options = {
  props: ['modelValue'],
  template: `
    <span class="ppz-input">
      <input class="reset-style" :value="modelValue"
        @focus="$emit('focus', $event)"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </span>
  `
}

export const style = `
  .ppz-input {
    position: relative;
  }
  .ppz-input::after {
    content: '';
    display: block;
    width: 100%;
    height: 100%;

    position: absolute;
    z-index: -1;
    left: 0;
    top: 0;
    background: currentColor;
    opacity: .05;
  }
  .ppz-input input {
    border: 1px solid transparent;
    color: inherit;
    height: 2em;
    width: 100%;
    padding: 0 .5em;
    outline: none;
  }
  .ppz-input input:focus {
    border: var(--border-focus);
  }
`