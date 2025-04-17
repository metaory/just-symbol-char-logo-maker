import './style.css'
import gradientGL from "gradient-gl"

gradientGL("a2.9c9b")

class ControlGroup extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: grid;
          gap: 0.5rem;
        }
        .label {
          font-size: var(--font-size-sm);
          opacity: var(--opacity-disabled);
        }
      </style>
      <div class="label"><slot name="label"></slot></div>
      <slot></slot>
    `
  }
}

customElements.define('control-group', ControlGroup)

class RangeControl extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 0.5rem;
          position: relative;
        }
        input {
          width: 100%;
          height: 0.5rem;
          border-radius: var(--radius);
          background: var(--control-bg);
          cursor: pointer;
          outline: var(--stroke-width) solid var(--control-bg);
        }
        input::-webkit-slider-thumb {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
        }
        span {
          min-width: 3rem;
          text-align: right;
          font-size: var(--font-size-sm);
          opacity: var(--opacity-disabled);
          font-variant-numeric: tabular-nums;
        }
        input::before {
          content: attr(value);
          position: absolute;
          top: -1.5rem;
          left: 0;
          font-size: var(--font-size-sm);
          opacity: var(--opacity-disabled);
          pointer-events: none;
          transform: translateX(calc(var(--value) * 1% - 50%));
          transition: transform var(--transition);
        }
      </style>
      <input type="range" part="input">
      <span part="value"></span>
    `
  }

  static get observedAttributes() {
    return ['min', 'max', 'step', 'value', 'title']
  }

  attributeChangedCallback(name, _, newValue) {
    if (name === 'value') {
      this.shadowRoot.querySelector('span').textContent = `${newValue}px`
      this.shadowRoot.querySelector('input').style.setProperty('--value', 
        ((newValue - this.getAttribute('min')) / (this.getAttribute('max') - this.getAttribute('min'))) * 100
      )
    }
    this.shadowRoot.querySelector('input').setAttribute(name, newValue)
  }

  connectedCallback() {
    const input = this.shadowRoot.querySelector('input')
    input.addEventListener('input', e => {
      this.setAttribute('value', e.target.value)
      this.dispatchEvent(new CustomEvent('change', { 
        detail: { value: e.target.value },
        bubbles: true,
        composed: true
      }))
    })
  }
}

customElements.define('range-control', RangeControl)

// Utils
const clamp = (min, max, value) => Math.min(max, Math.max(min, value))
const isSVG = text => text?.includes('<svg')
const createBlob = (content, type) => new Blob([content], { type })
const createDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// SVG Processing
const createSVGProcessor = state => {
  const process = svg => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, 'image/svg+xml')
    const svgElement = doc.querySelector('svg')
    
    if (!svgElement) return svg

    if (!svgElement.hasAttribute('viewBox')) {
      svgElement.setAttribute('viewBox', '0 0 24 24')
    }
    
    svgElement.setAttribute('width', state.iconSize)
    svgElement.setAttribute('height', state.iconSize)
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')

    for (const el of svgElement.querySelectorAll('*')) {
      if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') {
        el.setAttribute('fill', state.iconColor)
      }
      if (el.hasAttribute('stroke') || el.tagName.toLowerCase() === 'path' || 
          el.tagName.toLowerCase() === 'line' || el.tagName.toLowerCase() === 'rect' ||
          el.tagName.toLowerCase() === 'circle' || el.tagName.toLowerCase() === 'ellipse' ||
          el.tagName.toLowerCase() === 'polygon' || el.tagName.toLowerCase() === 'polyline') {
        el.setAttribute('stroke', state.strokeColor)
        el.setAttribute('stroke-width', state.strokeWidth)
      }
    }

    return svgElement.outerHTML
  }

  return { process }
}

// State Management
const createState = () => {
  const defaultSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M7.02 6.638c-.985.586-1.479.88-1.75 1.362S5 9.069 5 10.241v3.518c0 1.172 0 1.758.27 2.241c.271.483.765.776 1.75 1.362l2.96 1.759c.986.586 1.479.879 2.02.879s1.034-.293 2.02-.88l2.96-1.758c.985-.586 1.479-.88 1.75-1.362c.25-.448.269-.986.27-2M9.98 4.88C10.965 4.292 11.458 4 12 4s1.034.293 2.02.88l2.96 1.758c.985.586 1.479.88 1.75 1.362c.25.448.269.986.27 2"/><path stroke-linejoin="round" d="M5 8L2 6m17 2l3-2M5 16l-3 2"/><path d="m12 16.884l4-2.384"/></g></svg>`

  const state = {
    svg: defaultSVG,
    bgColor: '#f20033',
    bgRadius: 50,
    iconColor: '#5511FF',
    iconSize: 512,
    strokeColor: '#DD0044',
    strokeWidth: 2.3,
    originalSvg: defaultSVG
  }

  return new Proxy(state, {
    set(target, key, value) {
      target[key] = value
      updateUI()
      return true
    }
  })
}

// UI Updates
const createUIUpdater = (state, svgProcessor) => {
  const update = () => {
    const bg = document.querySelector('.bg')
    const placeholder = document.querySelector('.placeholder')
    const svgPreview = document.querySelector('.svg-preview')
    
    bg.style.background = state.bgColor
    bg.style.borderRadius = `${state.bgRadius}px`
    
    if (state.svg) {
      placeholder.style.display = 'none'
      if (!svgPreview) {
        const div = document.createElement('div')
        div.className = 'svg-preview'
        bg.appendChild(div)
      }
      document.querySelector('.svg-preview').innerHTML = svgProcessor.process(state.svg)
    } else {
      placeholder.style.display = 'grid'
      svgPreview?.remove()
    }
    
    document.getElementById('bg-color').value = state.bgColor
    document.getElementById('bg-radius').setAttribute('value', state.bgRadius)
    document.getElementById('icon-color').value = state.iconColor
    document.getElementById('icon-size').setAttribute('value', state.iconSize)
    document.getElementById('stroke-color').value = state.strokeColor
    document.getElementById('stroke-width').setAttribute('value', state.strokeWidth)
  }

  return { update }
}

// Event Handlers
const createEventHandlers = (state, svgProcessor) => {
  const handleSVGInput = text => {
    if (isSVG(text)) {
      state.svg = text
      state.originalSvg = text
    }
  }

  const handlers = {
    upload: () => document.getElementById('file-input').click(),
    file: async e => {
      const text = await e.target.files[0]?.text()
      if (text) handleSVGInput(text)
    },
    paste: () => {
      navigator.clipboard.readText()
        .then(handleSVGInput)
    },
    reset: () => {
      if (state.originalSvg) {
        state.svg = state.originalSvg
      }
    },
    exportSVG: () => {
      if (state.svg) {
        createDownload(createBlob(svgProcessor.process(state.svg), 'image/svg+xml'), 'icon.svg')
      }
    },
    exportPNG: () => {
      if (!state.svg) return
      
      const svgData = svgProcessor.process(state.svg)
      const img = new Image()
      const svgBlob = createBlob(svgData, 'image/svg+xml')
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = state.iconSize
        canvas.height = state.iconSize
        
        ctx.fillStyle = state.bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob(blob => {
          createDownload(blob, 'icon.png')
          URL.revokeObjectURL(url)
        }, 'image/png')
      }
      
      img.src = url
    }
  }

  return handlers
}

// Initialize
const state = createState()
const svgProcessor = createSVGProcessor(state)
const { update: updateUI } = createUIUpdater(state, svgProcessor)
const handlers = createEventHandlers(state, svgProcessor)

// Update UI with initial state
updateUI()

const setupEventListeners = () => {
  document.getElementById('upload-btn').addEventListener('click', handlers.upload)
  document.getElementById('file-input').addEventListener('change', handlers.file)
  document.getElementById('paste-btn').addEventListener('click', handlers.paste)
  document.getElementById('reset-btn').addEventListener('click', handlers.reset)
  document.getElementById('export-svg').addEventListener('click', handlers.exportSVG)
  document.getElementById('export-png').addEventListener('click', handlers.exportPNG)

  document.getElementById('bg-color').addEventListener('change', e => {
    state.bgColor = e.target.value
  })
  
  document.getElementById('bg-radius').addEventListener('change', e => {
    state.bgRadius = e.detail.value
  })
  
  document.getElementById('icon-color').addEventListener('change', e => {
    state.iconColor = e.target.value
  })
  
  document.getElementById('icon-size').addEventListener('change', e => {
    state.iconSize = clamp(8, 512, e.detail.value)
  })
  
  document.getElementById('stroke-color').addEventListener('change', e => {
    state.strokeColor = e.target.value
  })
  
  document.getElementById('stroke-width').addEventListener('change', e => {
    state.strokeWidth = e.detail.value
  })

  document.addEventListener('paste', e => {
    const text = e.clipboardData.getData('text/plain')
    handleSVGInput(text)
  })

  document.addEventListener('dragover', e => e.preventDefault())
  document.addEventListener('drop', e => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type === 'image/svg+xml') {
      file.text().then(handleSVGInput)
    }
  })
}

setupEventListeners()
