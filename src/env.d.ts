/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

// Tipos para Tailwind CSS
declare module 'tailwindcss/resolveConfig' {
  import { Config } from 'tailwindcss';
  export default function resolveConfig(config: Config): Config;
}

declare module 'tailwindcss/plugin' {
  import { PluginCreator } from 'postcss';
  import { Config } from 'tailwindcss';
  
  type PluginFunction = (options?: any) => {
    handler: PluginCreator<string>;
    config?: Partial<Config>;
  };
  
  const plugin: PluginFunction;
  export = plugin;
}

// Extender los tipos de Astro para incluir clases de Tailwind
import type { HTMLAttributes } from 'astro/types';

declare global {
  namespace JSX {
    interface HTMLAttributes<T> extends HTMLAttributes<T> {
      class?: string | Record<string, boolean> | (string | Record<string, boolean>)[];
    }
  }
}