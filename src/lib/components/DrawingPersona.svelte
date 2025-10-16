<!--
  Copyright (C) 2024 Joey Khalil - All Rights Reserved

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License version 3 as
  published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->

<svelte:options accessors={true} />

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import { LazyBrush, type Point } from 'lazy-brush'
  import simplify from 'simplify-js'
  import chroma from 'chroma-js'

  import { personas } from '$lib/svg'
  import {
    abort,
    resizeCanvas,
    drawImage,
    drawPoints,
    drawStrokes,
    scalePoints,
    roundPoints
  } from '$lib/utils'

  export let persona: PersonaKeys
  export let brushSize: number
  export let brushColor: string
  export let intensity: number | undefined
  export let valence: number | undefined

  export function undo(): void {
    history.pop()
    redraw(history)
  }

  export function getImgDim(): {
    imgWidth: number
    imgHeight: number
    scaleFactor: number
  } {
    return { imgWidth, imgHeight, scaleFactor }
  }

  const dispatch = createEventDispatcher()

  let lazy: LazyBrush
  let canvas: PersonaCanvases = {}
  let context: PersonaContextes = {}
  let width: number = 0
  let height: number = 0
  let imgWidth: number
  let imgHeight: number
  let scaleFactor: number = 1.0
  let imageSvgPath: string | undefined = personas[persona]
  let image: HTMLImageElement
  let pointerMoved: boolean = true
  let isPressing: boolean = false
  let isDrawing: boolean = false
  let points: Point[] = []
  let history: Stroke[] = []

  $: scaledBrushSize = brushSize * scaleFactor
  $: brushDotSize = scaledBrushSize * 0.075
  $: brushDotColor = getBrushDotColorFor(brushColor)
  $: canDraw = intensity !== undefined && valence !== undefined;

  onMount(() => {
    if (imageSvgPath == undefined) {
      abort(`Error: Persona SVG path of ${persona} was not found.`)
      return
    }

    initContextes()

    // Load the persona image.
    image.onload = onImageLoaded
    image.src = imageSvgPath

    // Init the brush.
    lazy = new LazyBrush({
      enabled: true,
      initialPoint: { x: 0, y: 0 },
      radius: scaledBrushSize * 0.05 // lazy area of the brush
    })

    // Start refreshing the brush canvas.
    loop()
  })

  // This function updates the brush location in the canvas as the user moves
  // her mouse inside it.
  // It is called continuously, hence its name, except if the `once` parameter
  // is true.
  function loop(once = false): void {
    if (pointerMoved) {
      const atPoint = lazy.getPointerCoordinates()
      drawBrush(atPoint)
      pointerMoved = false
    }

    if (once === false) {
      window.requestAnimationFrame(() => loop())
    }
  }

  function initContextes(): void {
    // Brush layer
    let cv = canvas.brush!
    let ctx = cv.getContext('2d')

    if (ctx == undefined) {
      abort(`Error: Could not get context of brush canvas for ${persona}.`)
      return
    }

    context.brush = ctx

    // Drawing layer
    cv = canvas.drawing!
    ctx = cv.getContext('2d')

    if (ctx == undefined) {
      abort(`Error: Could not get context of drawing canvas for ${persona}.`)
      return
    }

    context.drawing = ctx
  }

  function onImageLoaded(): void {
    imgWidth = image.naturalWidth
    imgHeight = image.naturalHeight

    // The persona image is sized via CSS relatively to the page layout.
    // We use its dimensions to resize the canvases so that they fit to the
    // persona image.
    const imageRect = image.getBoundingClientRect()
    resize('brush', imageRect.width, imageRect.height)
    resize('drawing', imageRect.width, imageRect.height)

    // Draw the persona image inside the canvas.
    drawPersona(imageRect.width, imageRect.height)

    // Save the resized image dimensions.
    width = imageRect.width
    height = imageRect.height

    // Compute the scale factor of to the resized persona image. This is used
    // to adjust the brush size so that it is proportional to the persona.
    // It is also used to normalize the pointer position when serializing the
    // stroke (see `saveStroke` function).
    scaleFactor = imageRect.width / imgWidth

    dispatch('scaleFactorUpdate', scaleFactor)
  }

  function resize(
    canvasName: 'brush' | 'drawing',
    newWidth: number,
    newHeight: number
  ): void {
    // Fit the canvases to the image dimensions.
    const cv = canvas[canvasName]!
    const ctx = context[canvasName]!

    resizeCanvas(newWidth, newHeight, cv, ctx)
  }

  function drawPersona(width: number, height: number): void {
    // Show the persona image to be able to draw it in the canvas.
    image.classList.remove('hidden')

    const ctx = context.drawing!

    drawImage(image, ctx, width, height, true)

    // Hide the image element as we don't need it anymore because we drew the
    // image inside the canvas. It also casts a shadow when drawing near the
    // edges of the persona if we don't hide it.
    image.classList.add('hidden')
  }

  function hideBrush(): void {
    const ctx = context.brush!
    ctx.clearRect(0, 0, width, height)
  }

  function drawBrush(atPoint: Point): void {
    const ctx = context.brush!
    ctx.clearRect(0, 0, width, height) // remove any previous brush

    // Draw the brush.
    ctx.beginPath()
    ctx.fillStyle = brushColor;
    ctx.shadowColor = 'gray'
    ctx.shadowBlur = 2
    ctx.arc(atPoint.x, atPoint.y, scaledBrushSize / 2, 0, 2 * Math.PI, false)
    ctx.fill()

    // Draw a dot inside the brush for better UX.
    ctx.beginPath()
    ctx.fillStyle = brushDotColor
    ctx.arc(atPoint.x, atPoint.y, brushDotSize, 0, 2 * Math.PI, false)
    ctx.fill()
  }

  // While clicking the mouse, each mouse movement triggers a call to this
  // function.
  function draw(
    points: Point[],
    color: string = brushColor,
    size: number = scaledBrushSize
  ): void {
    if (points.length < 2) return

    const ctx = context.drawing!

    // Clear the canvas and redraw all the strokes on each mouse movement to
    // avoid drawing overlapping strokes (a translucid stroke would become
    // opaque).
    redraw(history)

    drawPoints(points, ctx, color, size)
  }

  // This function receives a list of _normalized_ strokes to redraw.
  // Normalized means that the point coordinates and the brush size of each
  // stroke has been made independent of the size of the drawing canvas.
  // Instead, these values are relative to the original persona image.
  // So before redrawing, we must scale the values to fit our canvas.
  function redraw(strokes: Stroke[]): void {
    // First, we draw a new persona over the canvas, effectively clearing any
    // previous drawing.
    drawPersona(width, height)

    const ctx = context.drawing!
    drawStrokes(strokes, ctx, scaleFactor)
  }

  // This function computes the pointer position relative to the drawing canvas
  // which might have been resized to fit the user's screen.
  function getPointerPos(e: MouseEvent): Point | undefined {
    // We use the bounding rectangle in case the canvas was resized.
    const rect = canvas.drawing!.getBoundingClientRect()

    // Get pointer coordinates relative to the viewport.
    const clientX: number = e.clientX
    const clientY: number = e.clientY

    // Compute pointer position relative to the drawing canvas.
    const x: number = clientX - rect.left
    const y: number = clientY - rect.top

    return { x, y }
  }

  function handlePointerMove(point: Point): void {
    lazy.update(point)

    if (isPressing && !isDrawing) {
      isDrawing = true
      points.push(lazy.getBrushCoordinates())
    }

    if (isDrawing) {
      points.push(lazy.getBrushCoordinates())
      draw(points)
    }

    pointerMoved = true
  }

  function onCanvasMouseDown(e: MouseEvent): void {
    if (canDraw === false) return;

    const point = getPointerPos(e)

    if (point) {
      isPressing = true
      handlePointerMove(point)
    }
  }

  function onCanvasMouseMove(e: MouseEvent): void {
    if (canDraw === false) return;

    const point = getPointerPos(e)

    if (point) {
      handlePointerMove(point)
    }
  }

  function onCanvasMouseUp(): void {
    isPressing = false
    isDrawing = false
    const stroke: Stroke | undefined = saveStroke()

    if (stroke) {
      dispatch('drawingEnd', { persona, stroke })
    }

    points = [] // reset the drawing points before the next drawing
  }

  function onCanvasMouseEnter(): void {
    if (canDraw === false) return;

    document.body.style.cursor = 'none' // hide the system cursor
  }

  function onCanvasMouseLeave(e: MouseEvent): void {
    if (canDraw === false) return;

    hideBrush()
    document.body.style.cursor = 'auto' // show the system cursor
  }

  function saveStroke(): Stroke | undefined {
    if (intensity === undefined || valence === undefined || points.length < 1) {
      return undefined;
    }

    // On high resolution screens, the number of points that make up a stroke
    // might be very high. This will cause problems with backends such as
    // Qualtrics which limit the size of the data we can store.
    // However, we don't need to keep all the points down to the sub-pixel. A
    // reasonable approximation suffices. This is what we do here:
    //
    //    1. Reduce the number of points making up the stroke using the
    //       `simplify-js` library with a tolerance factor of 0.01.
    //    2. Normalize the points, i.e. make them independent of the canvas
    //       dimensions. Indeed, the original drawing points are taken from the
    //       drawing canvas which is resized to fit the page. So we must
    //       'unscale' them.
    //    3. Round the remaining point coordinates to the nearest pixel.
    //
    // The end result is a stroke made of less points while still visually
    // matching the user's drawing.
    const origPoints = points.slice() // copy the points array
    //const lessPoints = simplify(origPoints, 0.01, true)
    const lessPoints = simplify(origPoints, 0.1, false)
    const scaledPoints = scalePoints(lessPoints, 1 / scaleFactor)
    const roundedPoints = roundPoints(scaledPoints)

    // We save the _unscaled_ brush size because it is independent of any
    // resizing that might have been applied to the persona image. When the
    // stroke will be redrawn, the brush size will get scaled with the
    // appropriate scale factor depending on the size of the persona image
    // (refer to how the `scaledBrushSize` variable is used).
    const stroke: Stroke = {
      points: roundedPoints,
      brushColor,
      brushSize, // save the _unscaled_ brush size
      intensity,
      valence
    }

    history.push(stroke)

    return stroke
  }

  function getBrushDotColorFor(color: string): string {
    const contrast: number = chroma.contrast(chroma(color), chroma('white'))
    return contrast >= 2 ? 'white' : 'black'
  }
</script>

<svelte:window on:mouseup={onCanvasMouseUp} />

<img
  class="absolute left-1/2 -translate-x-1/2 h-full object-contain"
  bind:this={image}
/>

<canvas
  class="z-10 absolute left-1/2 -translate-x-1/2 h-full"
  bind:this={canvas.drawing}
/>

<canvas
  class="z-20 absolute left-1/2 -translate-x-1/2 h-full"
  on:click|stopPropagation
  on:mousedown|preventDefault={onCanvasMouseDown}
  on:mousemove|preventDefault={onCanvasMouseMove}
  on:mouseup|preventDefault={onCanvasMouseUp}
  on:mouseenter|preventDefault={onCanvasMouseEnter}
  on:mouseleave|preventDefault={onCanvasMouseLeave}
  bind:this={canvas.brush}
/>
