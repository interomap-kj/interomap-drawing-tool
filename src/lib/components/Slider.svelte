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

<script context="module" lang="ts">
    export type SliderStep = {
    label: string
    value: number
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'

  export let steps: SliderStep[]
  export let value: number | undefined = undefined
  export let withRuler: boolean = false
  export let isVertical: boolean = false
  export let background: chroma.Scale | undefined = undefined
  export let handleColor: string | undefined = undefined

  const min: number = steps[0].value;
  const max: number = steps[steps.length - 1].value;

  let handleOffset: number | undefined = undefined;
  let wrapper: HTMLDivElement
  let wrapperLength: number
  let grabbing: boolean = false
  let stepsCount: number = steps.length;
  let scale: number = 0
  let grabStartX: number = 0
  let grabStartY: number = 0
  let grabStartValue: number | undefined = value;
  let markersPositions: number[]

  $: if (background && value !== undefined) updateHandler();

  function getValuePos(): number {
    if (value === undefined) {
      throw "Cannot compute handler position if value is not set.";
    }

    const stepIdx = steps.findIndex((step) => step.value === value);

    return stepIdx / (stepsCount - 1);
  }

  function updateHandler(): void {
    const valuePos = getValuePos();
    handleOffset = 100 * valuePos;

    if (background) {
      handleColor = background(valuePos).css();
    }
  }

  function onHandleMouseDown(event: MouseEvent): void {
    grabbing = true
    grabStartX = event.screenX
    grabStartY = event.screenY
    grabStartValue = value
  }

  function onWindowMouseMove(event: MouseEvent): void {
    if (grabbing === false) return

    let mouseMovement: number

    if (isVertical) {
      mouseMovement = grabStartY - event.screenY
    } else {
      mouseMovement = event.screenX - grabStartX
    }

    if (grabStartValue === undefined) {
      // First handler movement, select first value on the slider by default.
      grabStartValue = min;
    }

    const deltaValue = Math.round(mouseMovement * scale)
    const newValue = grabStartValue + deltaValue

    if (newValue < min) {
      value = min;
    } else if (newValue > max) {
      value = max;
    } else {
      value = newValue
    }

    updateHandler();
  }

  function onWindowMouseUp(): void {
    if (grabbing) grabbing = false
  }

  function findNearestStep(pos: number): number {
    const stepLength = wrapperLength / (stepsCount - 1);
    const stepCoord = steps.map((_, idx) => idx * stepLength);
    const stepDistance = stepCoord.map((coord) => Math.abs(coord - pos))
    const minDistance = Math.min(...stepDistance);

    return stepDistance.indexOf(minDistance);
  }

  function onSliderClick(e: MouseEvent): void {
    // Get the coordinate of the click relative to the slider (in pixels).
    const rect = wrapper.getBoundingClientRect();

    let clickPos: number

    if (isVertical) {
      clickPos = e.clientY - Math.round(rect.y)
    } else {
      clickPos = e.clientX - Math.round(rect.x)
    }

    let nearestStepIdx = findNearestStep(clickPos);

    if (isVertical) {
      // We must invert the index whent the slider is vertical because the
      // first value is at the bottom and not at the top of the slider.
      nearestStepIdx = stepsCount - nearestStepIdx - 1
    }

    value = steps[nearestStepIdx].value;
    updateHandler();
  }

  function getMarkerStyle(idx: number): string {
    let rulerStyle = "";

    if (isVertical) {
      rulerStyle = `bottom: ${markersPositions[idx]}%; right: 100%; transform: translateY(50%);`;
    } else {
      rulerStyle = `top: 100%; bottom: 100%; left: ${markersPositions[idx]}%; transform: translateX(-50%);`;
    }

    return rulerStyle;
  }

  onMount(() => {
    // We can compute these values only after the wrapper is added to the DOM.
    wrapperLength = isVertical ? wrapper.offsetHeight : wrapper.offsetWidth
    scale = stepsCount / wrapperLength
    markersPositions = steps.map((_, idx) => 100 * idx / (stepsCount - 1))
  });
</script>

<svelte:window on:mousemove|preventDefault={onWindowMouseMove} on:mouseup={onWindowMouseUp} />

{#key background}
<div class="{$$props.class ?? ''} wrapper" bind:this={wrapper}>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="slider-wrapper ui-slider {isVertical ? 'w-5 h-full' : 'w-full h-5'}"
    style="background: {background ? `linear-gradient(${isVertical ? '0deg' : '90deg'}, ${background(0).css()} 0%, ${background(1).css()} 100%)` : '#efefef'};"
    on:click={onSliderClick}
  >
    {#if handleOffset !== undefined}
      <span
        class="ui-slider-handle"
        style="top: {isVertical ? '' : '50%'}; bottom: {isVertical ? handleOffset + '%' : ''}; left: {isVertical ? '50%' : handleOffset + '%'}; transform: translate(-50%, {isVertical ? '50%' : '-50%'}); background: {handleColor ? handleColor : 'linear-gradient(#555,#454545)'};"
        on:mousedown|preventDefault={onHandleMouseDown}
      >
      </span>
    {/if}

    <div class="range-wrapper">
      <div class="range"></div>
    </div>

    {#if withRuler && markersPositions}
      {#each steps as step, idx}
        <div
          class="marker"
          class:pr-4={isVertical}
          class:pt-4={!isVertical}
          class:vertical={isVertical}
          style={getMarkerStyle(idx)}
        >
          {step.label}
        </div>
      {/each}
    {/if}
  </div>
</div>
{/key}

<style>
.slider-wrapper {
  display: inline-block;
  position: relative;
}

.ui-slider {
  border: 1px solid #d2d2d2;
  position: relative;
  border-radius: 100px;
}

.ui-slider-handle {
  position: absolute;
  width: 32px;
  height: 32px;
  display: block;
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 100px;
  z-index: 10;
  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;
  cursor: -moz-grab;
  cursor: -webkit-grab;
  box-shadow: inset 3px 3px 7px 2px rgba(255,255,255,0.25), 0 0 4px 2px rgba(0,0,0,0.2);
  transition: width 0.1s;
}

.ui-slider-handle:focus {
  outline: none;
}

.ui-slider-handle:active {
  width: 22px;
  cursor: grabbing;
  cursor: -moz-grabbing;
  cursor: -webkit-grabbing;
}

.range-wrapper{
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
}

.marker {
  position: absolute;
  font-size: 13px;
  color: #555555;
  letter-spacing: 0.05em;
}

.marker:not(.vertical):after {
    content: '';
    width: 1px;
    height: 8px;
    background: #d2d2d2;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }

.marker.vertical:before {
    content: '';
    width: 8px;
    height: 1px;
    background: #d2d2d2;
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
</style>
