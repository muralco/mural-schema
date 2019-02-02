export interface Options {
  ignore?: string[] | ((name: string) => boolean);
  recursivePartial?: string[];
}
