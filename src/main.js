import gradientGL from "gradient-gl"

gradientGL("a2.8b9d")

const $ = (s) => document.querySelector(s)
const bg = $('#bg')
const iconGroup = $('#icon')
let iconContent = iconGroup.firstElementChild

const updateBackground = () => {
  const size = +$('#bg-size')?.value || 100
  const x = 150 - size / 2
  const y = 150 - size / 2

  const attrs = {
    x,
    y,
    width: size,
    height: size,
    rx: $('#bg-radius')?.value || 10,
    fill: $('#bg-fill')?.value || '#4411bb',
    stroke: $('#bg-stroke')?.value || '#000',
    'stroke-width': $('#bg-stroke-width')?.value || 2,
  }

  for (const [k, v] of Object.entries(attrs)) {
    bg.setAttribute(k, v)
  }

  const rangeInputs = ['bg-size', 'bg-radius', 'bg-stroke-width']
  for (const id of rangeInputs) {
    const el = $(`#${id}`)
    if (el) el.setAttribute('value', el.value)
  }
}

const updateIcon = () => {
  const scale = $('#icon-scale')?.value || 1
  const rotate = $('#icon-rotate')?.value || 0

  iconGroup.setAttribute('transform', `translate(150,150) scale(${scale}) rotate(${rotate})`)

  if (!iconContent) return

  const attrs = {
    fill: $('#icon-fill')?.value || '#330066',
    stroke: $('#icon-stroke')?.value || '#DD1166',
    'stroke-width': $('#icon-stroke-width')?.value || 0,
  }

  for (const [k, v] of Object.entries(attrs)) {
    iconContent.setAttribute(k, v)
  }

  const rangeInputs = ['icon-scale', 'icon-stroke-width', 'icon-rotate']
  for (const id of rangeInputs) {
    const el = $(`#${id}`)
    if (el) el.setAttribute('value', el.value)
  }
}

const centerElement = (el) => {
  const bbox = el.getBBox()
  const dx = -bbox.x - bbox.width / 2
  const dy = -bbox.y - bbox.height / 2
  el.setAttribute('transform', `translate(${dx},${dy})`)
}

const loadIcon = () => {
  const input = $('#icon-input').value.trim()
  if (!input) return

  iconGroup.innerHTML = ''

  if (input.startsWith('<svg')) {
    const temp = document.createElement('div')
    temp.innerHTML = input
    const parsed = temp.querySelector('svg')
    if (!parsed) return

    // Get viewBox or calculate bounds
    const viewBox = parsed.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 300, 300]
    const [x, y, width, height] = viewBox
    const centerX = x + width / 2
    const centerY = y + height / 2

    // Create a group to hold the content
    const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')

    // Add all children to the content group
    for (const child of parsed.children) {
      const clone = child.cloneNode(true)
      // Ensure fill and stroke attributes are preserved
      if (clone.hasAttribute('fill')) clone.setAttribute('fill', $('#icon-fill').value)
      if (clone.hasAttribute('stroke')) clone.setAttribute('stroke', $('#icon-stroke').value)
      if (clone.hasAttribute('stroke-width'))
        clone.setAttribute('stroke-width', $('#icon-stroke-width').value)
      contentGroup.appendChild(clone)
    }

    // Center the content group
    contentGroup.setAttribute('transform', `translate(${-centerX},${-centerY})`)

    // Add the centered content to our icon group
    iconGroup.appendChild(contentGroup)
  } else {
    iconGroup.innerHTML = `<text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-size="100">${input}</text>`
  }

  iconContent = iconGroup.firstElementChild
  updateIcon()
}

const exportSVG = () => {
  const svg = $('#logo')
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'logo.svg'
  link.click()
  URL.revokeObjectURL(link.href)
}

const exportPNG = () => {
  const svg = $('#logo')
  const svgString = new XMLSerializer().serializeToString(svg)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1024
  const ctx = canvas.getContext('2d')
  const img = new Image()

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = 'logo.png'
    link.click()
  }

  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`
}

// Event Listeners
const bgControls = ['bg-fill', 'bg-stroke', 'bg-size', 'bg-radius', 'bg-stroke-width']
const iconControls = ['icon-fill', 'icon-stroke', 'icon-scale', 'icon-stroke-width', 'icon-rotate']

for (const id of bgControls) {
  $(`#${id}`).addEventListener('input', updateBackground)
}

for (const id of iconControls) {
  $(`#${id}`).addEventListener('input', updateIcon)
}

$('#load-icon').addEventListener('click', loadIcon)
$('#export-svg').addEventListener('click', exportSVG)
$('#export-png').addEventListener('click', exportPNG)

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  updateIcon()
  updateBackground()
  // setupIconPicker($, (svg) => {
  //   $('#icon-input').value = svg
  //   loadIcon()
  // })
})

// Base Component Class
class BaseComponent extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this._subscriptions = new Set()
  }
  
  connectedCallback() {
    this.render()
  }
  
  disconnectedCallback() {
    for (const unsubscribe of this._subscriptions) {
      unsubscribe()
    }
    this._subscriptions.clear()
  }
  
  connect(key, callback) {
    const unsubscribe = store.subscribe(key, callback)
    this._subscriptions.add(unsubscribe)
  }
}

// Range Input Component
class RangeInput extends BaseComponent {
  constructor() {
    super()
    this._handleInput = this._handleInput.bind(this)
  }
  
  render() {
    const name = this.getAttribute('name')
    const label = this.getAttribute('label') || name
    const min = this.getAttribute('min') || 0
    const max = this.getAttribute('max') || 100
    const step = this.getAttribute('step') || 1
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .range-input {
          display: grid;
          gap: 0.5rem;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        label {
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .value {
          font-size: 0.8rem;
          opacity: 0.8;
          min-width: 3ch;
          text-align: right;
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: var(--control-bg, rgba(255, 255, 255, 0.1));
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent, #4411BB);
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent, #4411BB);
          cursor: pointer;
          border: none;
          transition: transform 0.2s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
        
        input[type="range"]::-webkit-slider-runnable-track {
          height: 6px;
          background: var(--control-bg, rgba(255, 255, 255, 0.1));
          border-radius: 3px;
        }
        
        input[type="range"]::-moz-range-track {
          height: 6px;
          background: var(--control-bg, rgba(255, 255, 255, 0.1));
          border-radius: 3px;
        }
      </style>
      
      <div class="range-input">
        <div class="header">
          <label for="input">${label}</label>
          <span class="value">0</span>
        </div>
        <input type="range" id="input" min="${min}" max="${max}" step="${step}">
      </div>
    `
    
    this.input = this.shadowRoot.querySelector('input')
    this.valueDisplay = this.shadowRoot.querySelector('.value')
    this.input.addEventListener('input', this._handleInput)
    
    // Connect to store
    this.connect(name, this._updateFromStore.bind(this))
    
    // Initialize from state
    if (state[name] !== undefined) {
      this.input.value = state[name]
      this.valueDisplay.textContent = state[name]
    }
  }
  
  _handleInput(e) {
    const name = this.getAttribute('name')
    const value = e.target.type === 'range' ? 
      Number.parseFloat(e.target.value) : 
      e.target.value
    
    this.valueDisplay.textContent = value
    state[name] = value
  }
  
  _updateFromStore(value) {
    if (Number.parseFloat(this.input.value) !== value) {
      this.input.value = value
      this.valueDisplay.textContent = value
    }
  }
}
