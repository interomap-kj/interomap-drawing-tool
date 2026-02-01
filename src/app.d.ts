/*
 * Copyright (C) 2024 Joey Khalil - All Rights Reserved
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

// See https://kit.svelte.dev/docs/types#app

import type { Point } from 'lazy-brush'
import type { ComponentProps } from 'svelte'

import { BrushSizes } from '$lib/constants'

import type DrawingPersona from '$lib/components/DrawingPersona.svelte'
import type WorkspacePanel from '$lib/components/WorkspacePanel.svelte'
import type { Writable } from 'svelte/store'

// for information about these interfaces
declare global {
	interface CustomMouseEvent extends MouseEvent {
		layerX: number
		layerY: number
		canDraw: boolean
	}

	type PersonaCreatedEvent = {
		scaleFactor: number
	}

	enum Persona {
	  ChildFront,
	  ChildBack,
		MaleFront,
		MaleBack,
		FemaleFront,
		FemaleBack,
	}

	type PersonaKeys = keyof typeof Persona

	type SvgPath = {
		[side in PersonaKeys]: string
	}

	type PersonaCanvases = {
		brush?: HTMLCanvasElement
		drawing?: HTMLCanvasElement
	}

	type PersonaContextes = {
		brush?: CanvasRenderingContext2D
		drawing?: CanvasRenderingContext2D
	}

	type Stroke = {
		points: Point[]
		brushColor: string
		brushSize: number
		intensity: number
		valence: number
	}

	type DrawingHistoryItem = {
		persona: PersonaKeys
		stroke: Stroke
		intensity: number
		valence: number
	}

  type PersonaDrawing = {
    imgWidth: number
    imgHeight: number
    scaleFactor: number
    strokes: Stroke[]
  }

	type Drawing = {
		[persona in PersonaKeys]?: PersonaDrawing
	}

}

export { };
