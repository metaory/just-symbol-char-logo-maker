const $ = (s) => document.querySelector(s)
const bg = $('#bg')
const iconGroup = $('#icon')
let iconContent = iconGroup.firstElementChild

const updateBackground = () => {
  const size = +$('#bg-size')?.value || 100
  const x = 150 - size / 2
  const y = 150 - size / 2
  
  const attrs = {
    x, y, width: size, height: size,
    rx: $('#bg-radius')?.value || 10,
    fill: $('#bg-fill')?.value || '#f5f5f5',
    stroke: $('#bg-stroke')?.value || '#000',
    'stroke-width': $('#bg-stroke-width')?.value || 2
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
    'stroke-width': $('#icon-stroke-width')?.value || 0
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
  const dx = -bbox.x - bbox.width/2
  const dy = -bbox.y - bbox.height/2
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
    const centerX = x + width/2
    const centerY = y + height/2
    
    // Create a group to hold the content
    const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    
    // Add all children to the content group
    for (const child of parsed.children) {
      const clone = child.cloneNode(true)
      // Ensure fill and stroke attributes are preserved
      if (clone.hasAttribute('fill')) clone.setAttribute('fill', $('#icon-fill').value)
      if (clone.hasAttribute('stroke')) clone.setAttribute('stroke', $('#icon-stroke').value)
      if (clone.hasAttribute('stroke-width')) clone.setAttribute('stroke-width', $('#icon-stroke-width').value)
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
})
