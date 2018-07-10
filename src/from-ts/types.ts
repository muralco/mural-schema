export interface Options {
  ignore?: string[] | ((name: string) => boolean);
  quote?: boolean;
}
