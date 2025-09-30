/// <reference types="astro/client" />

declare module '*.sql?raw' {
    const content: string;
    export default content;
}


