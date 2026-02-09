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

<script lang="ts">
  import { onMount } from 'svelte'
  import chroma from 'chroma-js'
  import tippy from 'tippy.js'

  import { browser } from '$app/environment'

  import { BrushSizes } from '$lib/constants'

  import DrawingPersona from '$lib/components/DrawingPersona.svelte'
  import Toolbar from '$lib/components/Toolbar.svelte'
  import ToolbarItem from '$lib/components/ToolbarItem.svelte'
  import Slider, { type SliderStep } from '$lib/components/Slider.svelte'
  import { range } from '$lib/utils';
  import locales from '$lib/assets/locales.json';

  // Qualtrics allows embedded data to be up to 20,000 ASCII characters long.
  // For more info: https://www.qualtrics.com/support/survey-platform/survey-module/survey-flow/standard-elements/embedded-data/#BestPractices
  const QUALTRICS_MAX_DATA_LENGTH = 20000 // ASCII characters

  // Slider has labels in the [-5;5] range but internally these values are
  // mapped to the [1; 11] range.
  const intensitySteps: SliderStep[] = range(1, 11, 1).map((value) => {
    return { value, label: (value - 6).toString() };
  })
  const valenceSteps: SliderStep[] = range(1, 11, 1).map((value) => {
    return { value, label: (value - 6).toString() };
  })

  // The color of the first intensity step is not perfect white because the
  // value of the step is 1 (it doesn't start at 0).
  // To find out this color, we must find the percentage of the first step on
  // the scale of the steps. Then we must "invert" it to find the luminance
  // factor we must apply in order to, eventually, find the first step color.
  const intensityFirstStepPct = intensitySteps[0].value / intensitySteps.length;
  const intensityLumiFactor = 1 - intensityFirstStepPct;
  const intensityColorScaleFirst = chroma('green').luminance(intensityLumiFactor);

  const qualtricsVariable = getFromUrl("variable")

  let langKey = getFromUrl("lang") ?? "en";
  let locale;
  let persona: 'Child' | 'Female' | 'Male' | undefined = getPersonaFromURL();
  let drawingPersonaFront: DrawingPersona
  let drawingPersonaBack: DrawingPersona
  let selectedBrushSize: number = BrushSizes.MEDIUM
  let brushColor: string = 'black'
  let intensity: number | undefined = undefined;
  let valence: number | undefined = undefined;
  let intensityColorScale = chroma.scale([
    intensityColorScaleFirst, chroma('green')
  ])
  let valenceColorScale = chroma.scale([chroma('red'), chroma('green')])
  let valenceColor: string
  let output: string
  let creditsAnchor: HTMLAnchorElement | undefined
  let creditsContent: HTMLDivElement | undefined
  let drawingHistory: DrawingHistoryItem[] = []
  let scaleFactor: number | undefined

  $: if (valence !== undefined) {
    // On valence update
    const pct = valence / valenceSteps.length;
    valenceColor = valenceColorScale(pct).hex();
    intensityColorScale = chroma.scale([
      chroma(valenceColor).luminance(intensityLumiFactor), chroma(valenceColor)
    ])
  }

  $: if (valenceColor && intensity !== undefined) {
    const pct = intensity / intensitySteps.length;
    brushColor = intensityColorScale(pct).hex();
  }

  $: if (langKey) {
    if (!(langKey in locales)) {
      console.error(`Unknown language key: ${langKey}. Switching to English.`);
      langKey = "en";
    }

    locale = locales[langKey];
  }

  $: if (persona && drawingPersonaFront && drawingPersonaBack) {
    // This call will create an output with no strokes and send it to Qualtrics.
    // The goal is to have an output in case the participant does not draw at
    // all.
    updateOutput();
  }

  function getFromUrl(param: string): string | undefined {
    let value = undefined

    if (browser) {
      const params = new URLSearchParams(window.location.search)
      value = params.get(param)?.toLowerCase()
    }

    return value
  }

  function getPersonaFromURL(): 'Child' | 'Female' | 'Male' | undefined {
    const personaParam = getFromUrl('persona')

    if (personaParam === 'child') {
      return 'Child'
    } else if (personaParam === 'female') {
      return 'Female'
    } else if (personaParam === 'male') {
      return 'Male'
    }

    return undefined
  }

  function initOutput(): Drawing {
    const output: Drawing = {};

    // Initialize each persona side.
    const frontKey: PersonaKeys = persona + "Front" as PersonaKeys;
    const backKey: PersonaKeys = persona + "Back" as PersonaKeys;
    const frontDims = drawingPersonaFront.getImgDim();
    const backDims = drawingPersonaBack.getImgDim();

    output[frontKey] = {
      imgWidth: frontDims.imgWidth,
      imgHeight: frontDims.imgHeight,
      scaleFactor: frontDims.scaleFactor,
      strokes: []
    };

    output[backKey] = {
      imgWidth: backDims.imgWidth,
      imgHeight: backDims.imgHeight,
      scaleFactor: backDims.scaleFactor,
      strokes: []
    };

    return output;
  }

  function updateOutput(): void {
    const newOutput: Drawing = initOutput();

    for (let item of drawingHistory) {
      const stroke: Stroke = {
        points: item.stroke.points,
        brushColor: item.stroke.brushColor,
        brushSize: item.stroke.brushSize,
        intensity: item.stroke.intensity,
        valence: item.stroke.valence
      }

      const persona = newOutput[item.persona]
      if (persona && persona.strokes) {
        persona.strokes.push(stroke);
      } else {
        throw `Output was not initialized for ${item.persona}`;
      }
    }

    output = JSON.stringify(newOutput)

    if (output.length >= QUALTRICS_MAX_DATA_LENGTH) {
      alert(
        'Sorry, the drawing exceeds the allowed size. Your last stroke cannot be saved.'
      )
      undo()
    }

    // Send the serialized output to the parent window.
    sendData()
  }

  function onUndoClick(): void {
    undo()
  }

  function undo(): void {
    const last: DrawingHistoryItem | undefined = drawingHistory.pop()

    if (last) {
      if (last.persona.includes('Front')) {
        drawingPersonaFront?.undo()
      } else {
        drawingPersonaBack?.undo()
      }

      updateOutput()
    }
  }

  function onDrawingEnd({
    detail: item
  }: {
    detail: DrawingHistoryItem
  }): void {
    drawingHistory.push(item)
    updateOutput()
  }

  function onScaleFactorUpdate({
    detail: newScaleFactor
  }: {
    detail: number
  }): void {
    scaleFactor = newScaleFactor
  }

  function sendData(): void {
    parent.postMessage({ event: 'interomap_data', variable: qualtricsVariable, output }, '*')
  }

  onMount(() => {
    if (creditsAnchor && creditsContent) {
      tippy(creditsAnchor, {
        content: creditsContent.innerHTML,
        allowHTML: true
      })
    }
  })
</script>

<section class="flex flex-col w-full h-full">
  {#if persona}
    <p class="mb-4 py-2 px-4 bg-white border shadow rounded-md text-center font-bold">
    {#if valence === undefined || intensity === undefined}
      <span class="text-red-500">
        {locale.sentences["Bitte gib an, wie angenehm oder unangenehm und wie stark du das spürst."]}.
      </span>
    {:else}
      {locale.sentences["Du kannst jetzt zeichnen"]}.
    {/if}
    </p>
  {/if}
  <div class="relative flex w-full h-3/4">
    {#if persona && scaleFactor}
      <div class="self-center flex flex-col ml-32">
        <Toolbar class="z-30 w-16">
          <ToolbarItem
            tooltip="Pencil size"
            options={Object.values(BrushSizes)}
          >
            <span
              class="block bg-[#454545] rounded-full"
              style="width: {selectedBrushSize *
                scaleFactor}px; height: {selectedBrushSize * scaleFactor}px;"
            />

            <button
              class="flex items-center justify-center hover:bg-slate-200 rounded-md"
              on:click={() => (selectedBrushSize = aBrushSize)}
              slot="option"
              let:value={aBrushSize}
            >
              <span
                class="block bg-[#454545] rounded-full"
                style="width: {aBrushSize *
                  scaleFactor}px; height: {aBrushSize * scaleFactor}px;"
              />
            </button>
          </ToolbarItem>
          <ToolbarItem class="p-1" tooltip="Undo">
            <button
              class="flex items-center justify-center w-full h-full hover:bg-slate-200 hover:cursor-pointer rounded-md"
              on:click={onUndoClick}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-arrow-back-up"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                stroke-width="2"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M9 14l-4 -4l4 -4" />
                <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
              </svg>
            </button>
          </ToolbarItem>
        </Toolbar>
      </div>
    {/if}

{#if persona}
  <div class="flex-grow relative">
    <DrawingPersona
      persona={
        persona === 'Child' ? 'ChildFront' :
        persona === 'Female' ? 'FemaleFront' :
        'MaleFront'
      }
      brushSize={selectedBrushSize}
      brushColor={chroma(brushColor).hex()}
      valence={valence}
      intensity={intensity}
      on:drawingEnd={onDrawingEnd}
      on:scaleFactorUpdate={onScaleFactorUpdate}
      bind:this={drawingPersonaFront}
    />
  </div>

  <div class="flex-grow relative">
    <DrawingPersona
      persona={
        persona === 'Child' ? 'ChildBack' :
        persona === 'Female' ? 'FemaleBack' :
        'MaleBack'
      }
      brushSize={selectedBrushSize}
      brushColor={chroma(brushColor).hex()}
      valence={valence}
      intensity={intensity}
      on:drawingEnd={onDrawingEnd}
      bind:this={drawingPersonaBack}
    />
  </div>
    {:else}
      <div class="flex-grow relative">
        <p>{locale.sentences["Please choose a persona"]}:</p>
        <button
          class="py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded shadow text-white"
          on:click={() => (persona = 'Female')}>{locale.words["Female"]}</button
        >
        <button
          class="py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded shadow text-white"
          on:click={() => (persona = 'Male')}>{locale.words["Male"]}</button
        >
        <button
          class="py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded shadow text-white"
          on:click={() => (persona = 'Child')}>{locale.words["Child"]}</button
        >
      </div>
    {/if}

    {#if persona}
      <div
        class="relative self-center flex flex-col items-center justify-center h-full mr-32"
      >
        <label class="text-sm font-semibold">{locale.words["Stark"]}</label>
        <span class="h-4" />
        <Slider
          class="h-96"
          steps={intensitySteps}
          withRuler={true}
          isVertical={true}
          background={intensityColorScale}
          bind:value={intensity}
        />
        <span class="h-4" />
        <label class="text-sm font-semibold">{locale.words["Schwach"]}</label>
        <label
          class="absolute top-1/2 -translate-y-1/2 left-full py-1 px-2 bg-neutral-900 rounded-md text-white text-sm font-semibold"
        >
          {locale.words["Stärke"]}
        </label>
      </div>
    {/if}
  </div>

  {#if persona}
    <div class="self-center justify-self-center w-auto h-1/4">
      <div class="flex justify-center py-3">
        <label
          class="py-1 px-2 bg-neutral-900 rounded-md text-white text-sm font-semibold"
          >{locale.words["Wie angenehm findest du das?"]}</label
        >
      </div>
      <div class="flex items-center">
        <label class="pb-2 text-sm font-semibold">{locale.words["Unangenehm"]}</label>
        <span class="w-4" />
        <Slider
          class="w-96 mx-auto"
          steps={valenceSteps}
          withRuler={true}
          background={valenceColorScale}
          bind:value={valence}
        />
        <span class="w-4" />
        <label class="pb-2 text-sm font-semibold">{locale.words["Angenehm"]}</label>
      </div>
    </div>
  {/if}

  <div class="text-right">
    <a href="" class="text-sm text-slate-400" bind:this={creditsAnchor}
      >Credits</a
    >
    <div class="hidden" bind:this={creditsContent}>
      <p class="text-xs">
        <b><u>Persona drawings</u></b><br />
        Attribution: Goran tek-en<br />
        License:
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/deed.en"
          target="_blank">CC BY-SA 4.0</a
        >
      </p>
    </div>
  </div>
</section>
