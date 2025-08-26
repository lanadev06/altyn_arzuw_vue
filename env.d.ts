/// <reference types="vite/client" />

declare module '*.vue' {
  import type { ComponentPublicInstance } from 'vue'
  const component: ComponentPublicInstance
  export default component
}
