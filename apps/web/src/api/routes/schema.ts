export type AsyncRouteMeta = {
  icon?: string;
  title: string;
  rank?: number;
  showLink: boolean;
  keepAlive: boolean;
  hiddenTag: boolean;
  fixedTag: boolean;
  auths?: string[];
};

export type AsyncRoute = {
  path: string;
  name?: string;
  component?: string;
  redirect?: string;
  meta: AsyncRouteMeta;
  children?: AsyncRoute[];
};

export type Result<T> = {
  code: number;
  message: string;
  data: T;
};
