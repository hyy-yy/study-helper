declare module 'pptx2json' {
  interface PptxSlide {
    texts: { text: string }[];
  }

  interface PptxResult {
    slides: PptxSlide[];
  }

  function pptx2json(buffer: Buffer): Promise<PptxResult>;
  export default pptx2json;
}
