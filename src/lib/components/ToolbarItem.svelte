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
  import { slide } from 'svelte/transition'

  export let tooltip: string | undefined = undefined
  export let options: any[] = []
  export let showOptions: boolean = false

  let timer: number
</script>

<li
    class="{$$props.class ?? ''} group relative flex items-center justify-center h-16"
    on:mouseenter={() => {
      clearTimeout(timer)
      showOptions = true
    }}
    on:mouseleave={() => {
      timer = setTimeout(() => (showOptions = false), 300)
    }}
  >
  {#if tooltip}
  <span class="absolute top-1/2 right-full -translate-y-1/2 min-w-max mr-4 py-1 px-2 bg-black rounded shadow-md text-white text-sm transition-all duration-300 opacity-0 group-hover:opacity-100">
    {tooltip}
  </span>
  {/if}

  <slot />

  {#if options.length > 0 && showOptions}
    <div
      class="z-10 absolute left-full grid items-stretch h-full ml-2 p-1 bg-white border rounded-md shadow-md"
      style="width: {options.length * 4}rem; grid-template-columns: repeat({options.length}, minmax(0, 1fr));"
      transition:slide={{ axis: 'x' }}
      on:click={() => (showOptions = false)}
    >
      {#each options as option}
        <slot name="option" value={option} />
      {/each}
    </div>
  {/if}
</li>
