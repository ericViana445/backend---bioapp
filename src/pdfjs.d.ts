declare module 'pdfjs-dist/build/pdf.js' {
  const pdfjsLib: any;
  export = pdfjsLib;
}

declare module 'pdfjs-dist/build/pdf.worker.js' {
  const workerSrc: string;
  export = workerSrc;
}