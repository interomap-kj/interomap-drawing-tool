import { c as create_ssr_component, d as createEventDispatcher, f as add_attribute, e as escape, h as each, v as validate_component } from "../../chunks/index.js";
import chroma from "chroma-js";
import "lazy-brush";
import "simplify-js";
const BrushSizes = {
  SMALL: 18,
  MEDIUM: 32,
  BIG: 54
};
function* iter_range(begin, end, step) {
  step = step ? step : 1;
  if (begin == end) {
    return;
  }
  if (begin > end) {
    step = step * -1;
  }
  for (let x = begin; x <= end; x += step) {
    yield x;
  }
}
function range(begin, end, step) {
  return Array.from(iter_range(begin, end, step));
}
function drawImage(image, context, width, height, clipping = false) {
  context.drawImage(image, 0, 0, width, height);
  if (clipping) {
    context.globalCompositeOperation = "source-atop";
  }
}
function drawPoints(points, context, color, size) {
  if (points.length < 2)
    return;
  context.lineJoin = "round";
  context.lineCap = "round";
  if (color) {
    context.strokeStyle = color;
  }
  if (size) {
    context.lineWidth = size;
  }
  let p1 = points[0];
  let p2 = points[1];
  context.beginPath();
  context.moveTo(p2.x, p2.y);
  for (let i = 1; i < points.length; i++) {
    const midPoint = getMidPoint(p1, p2);
    context.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    p1 = points[i];
    p2 = points[i + 1];
  }
  p1.x += 0.1;
  p1.y += 0.1;
  context.lineTo(p1.x, p1.y);
  context.stroke();
}
function getMidPoint(p1, p2) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  };
}
function drawStrokes(strokes, ctx, scaleFactor) {
  for (let stroke of strokes) {
    let points = stroke.points;
    let brushSize = stroke.brushSize;
    if (scaleFactor !== void 0) {
      points = scalePoints(stroke.points, scaleFactor);
      brushSize *= scaleFactor;
    }
    drawPoints(points, ctx, stroke.brushColor, brushSize);
  }
}
function scalePoints(points, scaleFactor) {
  return points.map((p) => ({ x: p.x * scaleFactor, y: p.y * scaleFactor }));
}
const DrawingPersona = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { persona } = $$props;
  let { brushSize } = $$props;
  let { brushColor } = $$props;
  let { intensity } = $$props;
  let { valence } = $$props;
  function undo() {
    history.pop();
    redraw(history);
  }
  function getImgDim() {
    return { imgWidth, imgHeight, scaleFactor };
  }
  createEventDispatcher();
  let canvas = {};
  let context = {};
  let width = 0;
  let height = 0;
  let imgWidth;
  let imgHeight;
  let scaleFactor = 1;
  let image;
  let history = [];
  function drawPersona(width2, height2) {
    image.classList.remove("hidden");
    const ctx = context.drawing;
    drawImage(image, ctx, width2, height2, true);
    image.classList.add("hidden");
  }
  function redraw(strokes) {
    drawPersona(width, height);
    const ctx = context.drawing;
    drawStrokes(strokes, ctx, scaleFactor);
  }
  function getBrushDotColorFor(color) {
    const contrast = chroma.contrast(chroma(color), chroma("white"));
    return contrast >= 2 ? "white" : "black";
  }
  if ($$props.persona === void 0 && $$bindings.persona && persona !== void 0)
    $$bindings.persona(persona);
  if ($$props.brushSize === void 0 && $$bindings.brushSize && brushSize !== void 0)
    $$bindings.brushSize(brushSize);
  if ($$props.brushColor === void 0 && $$bindings.brushColor && brushColor !== void 0)
    $$bindings.brushColor(brushColor);
  if ($$props.intensity === void 0 && $$bindings.intensity && intensity !== void 0)
    $$bindings.intensity(intensity);
  if ($$props.valence === void 0 && $$bindings.valence && valence !== void 0)
    $$bindings.valence(valence);
  if ($$props.undo === void 0 && $$bindings.undo && undo !== void 0)
    $$bindings.undo(undo);
  if ($$props.getImgDim === void 0 && $$bindings.getImgDim && getImgDim !== void 0)
    $$bindings.getImgDim(getImgDim);
  getBrushDotColorFor(brushColor);
  return `







<img class="absolute left-1/2 -translate-x-1/2 h-full object-contain"${add_attribute("this", image, 0)}>

<canvas class="z-10 absolute left-1/2 -translate-x-1/2 h-full"${add_attribute("this", canvas.drawing, 0)}></canvas>

<canvas class="z-20 absolute left-1/2 -translate-x-1/2 h-full"${add_attribute("this", canvas.brush, 0)}></canvas>`;
});
const Toolbar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `

<ul class="${escape($$props.class ?? "", true) + " border rounded-md shadow-md"}">${slots.default ? slots.default({}) : ``}</ul>`;
});
const ToolbarItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { tooltip = void 0 } = $$props;
  let { options = [] } = $$props;
  let { showOptions = false } = $$props;
  if ($$props.tooltip === void 0 && $$bindings.tooltip && tooltip !== void 0)
    $$bindings.tooltip(tooltip);
  if ($$props.options === void 0 && $$bindings.options && options !== void 0)
    $$bindings.options(options);
  if ($$props.showOptions === void 0 && $$bindings.showOptions && showOptions !== void 0)
    $$bindings.showOptions(showOptions);
  return `



<li class="${escape($$props.class ?? "", true) + " group relative flex items-center justify-center h-16"}">${tooltip ? `<span class="absolute top-1/2 right-full -translate-y-1/2 min-w-max mr-4 py-1 px-2 bg-black rounded shadow-md text-white text-sm transition-all duration-300 opacity-0 group-hover:opacity-100">${escape(tooltip)}</span>` : ``}

  ${slots.default ? slots.default({}) : ``}

  ${options.length > 0 && showOptions ? `<div class="z-10 absolute left-full grid items-stretch h-full ml-2 p-1 bg-white border rounded-md shadow-md" style="${"width: " + escape(options.length * 4, true) + "rem; grid-template-columns: repeat(" + escape(options.length, true) + ", minmax(0, 1fr));"}">${each(options, (option) => {
    return `${slots.option ? slots.option({ value: option }) : ``}`;
  })}</div>` : ``}</li>`;
});
const Slider_svelte_svelte_type_style_lang = "";
const css = {
  code: ".slider-wrapper.svelte-rlu4k4{display:inline-block;position:relative}.ui-slider.svelte-rlu4k4{border:1px solid #d2d2d2;position:relative;border-radius:100px}.ui-slider-handle.svelte-rlu4k4{position:absolute;width:32px;height:32px;display:block;border:2px solid rgba(255,255,255,0.1);border-radius:100px;z-index:10;cursor:move;cursor:grab;cursor:-moz-grab;cursor:-webkit-grab;box-shadow:inset 3px 3px 7px 2px rgba(255,255,255,0.25), 0 0 4px 2px rgba(0,0,0,0.2);transition:width 0.1s}.ui-slider-handle.svelte-rlu4k4:focus{outline:none}.ui-slider-handle.svelte-rlu4k4:active{width:22px;cursor:grabbing;cursor:-moz-grabbing;cursor:-webkit-grabbing}.range-wrapper.svelte-rlu4k4{position:absolute;top:-50px;left:50%;transform:translateX(-50%)}.marker.svelte-rlu4k4{position:absolute;font-size:13px;color:#555555;letter-spacing:0.05em}.marker.svelte-rlu4k4:not(.vertical):after{content:'';width:1px;height:8px;background:#d2d2d2;position:absolute;top:0;left:50%;transform:translateX(-50%)}.marker.vertical.svelte-rlu4k4:before{content:'';width:8px;height:1px;background:#d2d2d2;position:absolute;top:50%;right:0;transform:translateY(-50%)}",
  map: null
};
const Slider = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { steps } = $$props;
  let { value = void 0 } = $$props;
  let { withRuler = false } = $$props;
  let { isVertical = false } = $$props;
  let { background = void 0 } = $$props;
  let { handleColor = void 0 } = $$props;
  steps[0].value;
  steps[steps.length - 1].value;
  let handleOffset = void 0;
  let wrapper;
  let stepsCount = steps.length;
  let markersPositions;
  function getValuePos() {
    if (value === void 0) {
      throw "Cannot compute handler position if value is not set.";
    }
    const stepIdx = steps.findIndex((step) => step.value === value);
    return stepIdx / (stepsCount - 1);
  }
  function updateHandler() {
    const valuePos = getValuePos();
    handleOffset = 100 * valuePos;
    if (background) {
      handleColor = background(valuePos).css();
    }
  }
  function getMarkerStyle(idx) {
    let rulerStyle = "";
    if (isVertical) {
      rulerStyle = `bottom: ${markersPositions[idx]}%; right: 100%; transform: translateY(50%);`;
    } else {
      rulerStyle = `top: 100%; bottom: 100%; left: ${markersPositions[idx]}%; transform: translateX(-50%);`;
    }
    return rulerStyle;
  }
  if ($$props.steps === void 0 && $$bindings.steps && steps !== void 0)
    $$bindings.steps(steps);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0)
    $$bindings.value(value);
  if ($$props.withRuler === void 0 && $$bindings.withRuler && withRuler !== void 0)
    $$bindings.withRuler(withRuler);
  if ($$props.isVertical === void 0 && $$bindings.isVertical && isVertical !== void 0)
    $$bindings.isVertical(isVertical);
  if ($$props.background === void 0 && $$bindings.background && background !== void 0)
    $$bindings.background(background);
  if ($$props.handleColor === void 0 && $$bindings.handleColor && handleColor !== void 0)
    $$bindings.handleColor(handleColor);
  $$result.css.add(css);
  {
    if (background && value !== void 0)
      updateHandler();
  }
  return `







<div class="${escape($$props.class ?? "", true) + " wrapper svelte-rlu4k4"}"${add_attribute("this", wrapper, 0)}>
  <div class="${"slider-wrapper ui-slider " + escape(isVertical ? "w-5 h-full" : "w-full h-5", true) + " svelte-rlu4k4"}" style="${"background: " + escape(
    background ? `linear-gradient(${isVertical ? "0deg" : "90deg"}, ${background(0).css()} 0%, ${background(1).css()} 100%)` : "#efefef",
    true
  ) + ";"}">${handleOffset !== void 0 ? `<span class="ui-slider-handle svelte-rlu4k4" style="${"top: " + escape(isVertical ? "" : "50%", true) + "; bottom: " + escape(isVertical ? handleOffset + "%" : "", true) + "; left: " + escape(isVertical ? "50%" : handleOffset + "%", true) + "; transform: translate(-50%, " + escape(isVertical ? "50%" : "-50%", true) + "); background: " + escape(
    handleColor ? handleColor : "linear-gradient(#555,#454545)",
    true
  ) + ";"}"></span>` : ``}

    <div class="range-wrapper svelte-rlu4k4"><div class="range"></div></div>

    ${withRuler && markersPositions ? `${each(steps, (step, idx) => {
    return `<div class="${[
      "marker svelte-rlu4k4",
      (isVertical ? "pr-4" : "") + " " + (!isVertical ? "pt-4" : "") + " " + (isVertical ? "vertical" : "")
    ].join(" ").trim()}"${add_attribute("style", getMarkerStyle(idx), 0)}>${escape(step.label)}
        </div>`;
  })}` : ``}</div></div>`;
});
const en = {
  sentences: {
    "Please choose a persona": "Please choose a persona",
    "Please select the levels of pleasantness and intensity": "Please select the levels of pleasantness and intensity",
    "You may now draw": "You may now draw"
  },
  words: {
    Child: "Child",
    Female: "Female",
    Intensity: "Intensity",
    Male: "Male",
    Pleasant: "Pleasant",
    Pleasantness: "Pleasantness",
    Strong: "Strong",
    Unpleasant: "Unpleasant",
    Weak: "Weak"
  }
};
const fr = {
  sentences: {
    "Please choose a persona": "Veuillez choisir un personnage",
    "Please select the levels of pleasantness and intensity": "Veuillez choisir un niveau d'agréabilité et un niveau d'intensité",
    "You may now draw": "Vous pouvez dessiner"
  },
  words: {
    Female: "Femme",
    Intensity: "Intensité",
    Male: "Homme",
    Pleasant: "Agréable",
    Pleasantness: "Agréabilité",
    Strong: "Fort",
    Unpleasant: "Désagréable",
    Weak: "Faible"
  }
};
const locales = {
  en,
  fr
};
const QUALTRICS_MAX_DATA_LENGTH = 2e4;
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const intensitySteps = range(1, 11, 1).map((value) => {
    return { value, label: (value - 6).toString() };
  });
  const valenceSteps = range(1, 11, 1).map((value) => {
    return { value, label: (value - 6).toString() };
  });
  const intensityFirstStepPct = intensitySteps[0].value / intensitySteps.length;
  const intensityLumiFactor = 1 - intensityFirstStepPct;
  const intensityColorScaleFirst = chroma("green").luminance(intensityLumiFactor);
  const qualtricsVariable = getFromUrl();
  let langKey = "en";
  let locale;
  let persona = getPersonaFromURL();
  let drawingPersonaFront;
  let drawingPersonaBack;
  let selectedBrushSize = BrushSizes.MEDIUM;
  let brushColor = "black";
  let intensity = void 0;
  let valence = void 0;
  let intensityColorScale = chroma.scale([intensityColorScaleFirst, chroma("green")]);
  let valenceColorScale = chroma.scale([chroma("red"), chroma("green")]);
  let valenceColor;
  let output;
  let creditsAnchor;
  let creditsContent;
  let drawingHistory = [];
  let scaleFactor;
  function getFromUrl(param) {
    let value = void 0;
    return value;
  }
  function getPersonaFromURL() {
    return void 0;
  }
  function initOutput() {
    const output2 = {};
    const frontKey = persona + "Front";
    const backKey = persona + "Back";
    const frontDims = drawingPersonaFront.getImgDim();
    const backDims = drawingPersonaBack.getImgDim();
    output2[frontKey] = {
      imgWidth: frontDims.imgWidth,
      imgHeight: frontDims.imgHeight,
      scaleFactor: frontDims.scaleFactor,
      strokes: []
    };
    output2[backKey] = {
      imgWidth: backDims.imgWidth,
      imgHeight: backDims.imgHeight,
      scaleFactor: backDims.scaleFactor,
      strokes: []
    };
    return output2;
  }
  function updateOutput() {
    const newOutput = initOutput();
    for (let item of drawingHistory) {
      const stroke = {
        points: item.stroke.points,
        brushColor: item.stroke.brushColor,
        brushSize: item.stroke.brushSize,
        intensity: item.stroke.intensity,
        valence: item.stroke.valence
      };
      const persona2 = newOutput[item.persona];
      if (persona2 && persona2.strokes) {
        persona2.strokes.push(stroke);
      } else {
        throw `Output was not initialized for ${item.persona}`;
      }
    }
    output = JSON.stringify(newOutput);
    if (output.length >= QUALTRICS_MAX_DATA_LENGTH) {
      alert("Sorry, the drawing exceeds the allowed size. Your last stroke cannot be saved.");
      undo();
    }
    sendData();
  }
  function undo() {
    const last = drawingHistory.pop();
    if (last) {
      if (last.persona.includes("Front")) {
        drawingPersonaFront?.undo();
      } else {
        drawingPersonaBack?.undo();
      }
      updateOutput();
    }
  }
  function sendData() {
    parent.postMessage(
      {
        event: "interomap_data",
        variable: qualtricsVariable,
        output
      },
      "*"
    );
  }
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    {
      if (valence !== void 0) {
        const pct = valence / valenceSteps.length;
        valenceColor = valenceColorScale(pct).hex();
        intensityColorScale = chroma.scale([
          chroma(valenceColor).luminance(intensityLumiFactor),
          chroma(valenceColor)
        ]);
      }
    }
    {
      if (valenceColor && intensity !== void 0) {
        const pct = intensity / intensitySteps.length;
        brushColor = intensityColorScale(pct).hex();
      }
    }
    {
      if (langKey) {
        if (!(langKey in locales)) {
          console.error(`Unknown language key: ${langKey}. Switching to English.`);
          langKey = "en";
        }
        locale = locales[langKey];
      }
    }
    {
      if (persona && drawingPersonaFront && drawingPersonaBack) {
        updateOutput();
      }
    }
    $$rendered = `



<section class="flex flex-col w-full h-full">${persona ? `<p class="mb-4 py-2 px-4 bg-white border shadow rounded-md text-center font-bold">${valence === void 0 || intensity === void 0 ? `<span class="text-red-500">${escape(locale.sentences["Please select the levels of pleasantness and intensity"])}.
      </span>` : `${escape(locale.sentences["You may now draw"])}.`}</p>` : ``}
  <div class="relative flex w-full h-3/4">${persona && scaleFactor ? `<div class="self-center flex flex-col ml-32">${validate_component(Toolbar, "Toolbar").$$render($$result, { class: "z-30 w-16" }, {}, {
      default: () => {
        return `${validate_component(ToolbarItem, "ToolbarItem").$$render(
          $$result,
          {
            tooltip: "Pencil size",
            options: Object.values(BrushSizes)
          },
          {},
          {
            option: ({ value: aBrushSize }) => {
              return `<button class="flex items-center justify-center hover:bg-slate-200 rounded-md" slot="option"><span class="block bg-[#454545] rounded-full" style="${"width: " + escape(aBrushSize * scaleFactor, true) + "px; height: " + escape(aBrushSize * scaleFactor, true) + "px;"}"></span></button>`;
            },
            default: () => {
              return `<span class="block bg-[#454545] rounded-full" style="${"width: " + escape(selectedBrushSize * scaleFactor, true) + "px; height: " + escape(selectedBrushSize * scaleFactor, true) + "px;"}"></span>`;
            }
          }
        )}
          ${validate_component(ToolbarItem, "ToolbarItem").$$render($$result, { class: "p-1", tooltip: "Undo" }, {}, {
          default: () => {
            return `<button class="flex items-center justify-center w-full h-full hover:bg-slate-200 hover:cursor-pointer rounded-md"><svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-arrow-back-up" width="32" height="32" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M9 14l-4 -4l4 -4"></path><path d="M5 10h11a4 4 0 1 1 0 8h-1"></path></svg></button>`;
          }
        })}`;
      }
    })}</div>` : ``}

    ${persona ? `<div class="flex-grow relative">${validate_component(DrawingPersona, "DrawingPersona").$$render(
      $$result,
      {
        persona: persona === "Child" ? "ChildFront" : "MaleFront",
        brushSize: selectedBrushSize,
        brushColor: chroma(brushColor).hex(),
        valence,
        intensity,
        this: drawingPersonaFront
      },
      {
        this: ($$value) => {
          drawingPersonaFront = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div>
      <div class="flex-grow relative">${validate_component(DrawingPersona, "DrawingPersona").$$render(
      $$result,
      {
        persona: persona === "Child" ? "ChildBack" : "MaleBack",
        brushSize: selectedBrushSize,
        brushColor: chroma(brushColor).hex(),
        valence,
        intensity,
        this: drawingPersonaBack
      },
      {
        this: ($$value) => {
          drawingPersonaBack = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div>` : `<div class="flex-grow relative"><p>${escape(locale.sentences["Please choose a persona"])}:</p>
        <button class="py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded shadow text-white">${escape(locale.words["Female"])}</button>
        <button class="py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded shadow text-white">${escape(locale.words["Male"])}</button>
        <button class="py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded shadow text-white">${escape(locale.words["Child"])}</button></div>`}

    ${persona ? `<div class="relative self-center flex flex-col items-center justify-center h-full mr-32"><label class="text-sm font-semibold">${escape(locale.words["Strong"])}</label>
        <span class="h-4"></span>
        ${validate_component(Slider, "Slider").$$render(
      $$result,
      {
        class: "h-96",
        steps: intensitySteps,
        withRuler: true,
        isVertical: true,
        background: intensityColorScale,
        value: intensity
      },
      {
        value: ($$value) => {
          intensity = $$value;
          $$settled = false;
        }
      },
      {}
    )}
        <span class="h-4"></span>
        <label class="text-sm font-semibold">${escape(locale.words["Weak"])}</label>
        <label class="absolute top-1/2 -translate-y-1/2 left-full py-1 px-2 bg-neutral-900 rounded-md text-white text-sm font-semibold">${escape(locale.words["Intensity"])}</label></div>` : ``}</div>

  ${persona ? `<div class="self-center justify-self-center w-auto h-1/4"><div class="flex justify-center py-3"><label class="py-1 px-2 bg-neutral-900 rounded-md text-white text-sm font-semibold">${escape(locale.words["Pleasantness"])}</label></div>
      <div class="flex items-center"><label class="pb-2 text-sm font-semibold">${escape(locale.words["Unpleasant"])}</label>
        <span class="w-4"></span>
        ${validate_component(Slider, "Slider").$$render(
      $$result,
      {
        class: "w-96 mx-auto",
        steps: valenceSteps,
        withRuler: true,
        background: valenceColorScale,
        value: valence
      },
      {
        value: ($$value) => {
          valence = $$value;
          $$settled = false;
        }
      },
      {}
    )}
        <span class="w-4"></span>
        <label class="pb-2 text-sm font-semibold">${escape(locale.words["Pleasant"])}</label></div></div>` : ``}

  <div class="text-right"><a href="" class="text-sm text-slate-400"${add_attribute("this", creditsAnchor, 0)}>Credits</a>
    <div class="hidden"${add_attribute("this", creditsContent, 0)}><p class="text-xs"><b><u>Persona drawings</u></b><br>
        Attribution: Goran tek-en<br>
        License:
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en" target="_blank">CC BY-SA 4.0</a></p></div></div></section>`;
  } while (!$$settled);
  return $$rendered;
});
export {
  Page as default
};
