import { GenerateUrlFn, PathObj, PathObjResult } from "../types/path.js";
import queryString from "query-string";
import urlParse from "url-parse";
import { RouteDefWithoutUI } from "../types/routes.js";
import _ from "lodash";
import { ParamTypesClass, validateAndCleanInputParams } from "./params.js";
import { NotFoundError } from "./constants.js";

export function createTypedNavigator<T extends RouteDefWithoutUI>(rootDef: T): TypedNavigator<T> {
  return new TypedNavigator(rootDef) as any;
}

export class TypedNavigator<T extends RouteDefWithoutUI> {
  protected rootDef: T;
  protected PATHS_ACCESSOR = Symbol.for("PATHS_ACCESSOR");

  constructor(rootDef: T) {
    this.rootDef = rootDef;
  }

  /**
   * An object containing all the page paths in the app. Used as an input in many methods
   */
  public PATHS: PathObj<T> = (() => {
    const createProxyObj = (parentPaths: string[]): any =>
      new Proxy(
        {},
        {
          set: () => false,
          get: (__, propKey) => {
            if (propKey === this.PATHS_ACCESSOR) {
              return parentPaths;
            } else {
              parentPaths.push(propKey as string);
              return createProxyObj(parentPaths);
            }
          },
        },
      );

    return new Proxy(
      {},
      {
        get(__, propKey) {
          return createProxyObj([propKey as string]);
        },
      },
    ) as any;
  })();

  /**
   * Generate a url from path and params.
   */
  public generateUrl: GenerateUrlFn<T> = (path, inputParams, opts) => {
    const pathArr = this.getPathArrFromPathObjResult(path);
    return this.generateUrlFromPathArr(pathArr, inputParams, opts);
  };

  public validateUrl(url: string): { isValid: true } | { isValid: false; errors: string[] } {
    const { path, params } = parseUrl(url);

    const errors: string[] = [];

    this.forEachRouteDefUsingPathArray(path, (a) => {
      if (!a.thisDef) {
        errors.push(`Unable to find route for the url path ${path.join("/")}`);
      }
    });

    const pr = validateAndCleanInputParams(params, this.getAccumulatedParamTypesAtPath(path, false));

    if (!pr.isValid) {
      errors.push(...pr.errors);
    }

    return errors.length ? { isValid: false as const, errors } : { isValid: true as const };
  }

  protected getPathArrFromPathObjResult(path: PathObjResult<any, any, any, any, any, any, any, any>) {
    const pathArr: string[] = path[this.PATHS_ACCESSOR];
    if (!pathArr) {
      throw new Error("Invalid path object passed to generateUrl!");
    }
    return pathArr;
  }

  protected getAccumulatedParamTypesAtPath(pathArr: string[], throwOnNotFound: boolean): Record<string, any> {
    const paramTypes: Record<string, ParamTypesClass<any, any, any>> = {};
    this.forEachRouteDefUsingPathArray(pathArr, (a) => {
      if (!a.thisDef) {
        if (throwOnNotFound) {
          throw new NotFoundError({
            msg: `Unable to find route definitition for the path ${pathArr.join("/")}`,
            path: pathArr,
          });
        }
      } else {
        Object.assign(paramTypes, a.thisDef.params || {});
      }
    });

    return paramTypes;
  }

  /**
   * Iterates through the route definition with the given path, calling `process` for each route definition from root to leaf
   */
  protected forEachRouteDefUsingPathArray(
    pathArr: string[],
    processFn: (
      a: { thisDef: T; thisRouteName: string; thisPath: string[] } | { thisDef: null; thisPath: string[] },
    ) => void,
  ) {
    processFn({ thisDef: this.rootDef, thisRouteName: "", thisPath: [] });

    let currDef: T | null = this.rootDef;
    for (let i = 0; i < pathArr.length; i++) {
      const route = pathArr[i];
      const thisPath = pathArr.slice(0, i + 1);
      if (currDef && route && "routes" in currDef && currDef.routes?.[route as any]) {
        currDef = currDef.routes[route as any] as any;
        processFn({ thisDef: currDef!, thisRouteName: route, thisPath });
      } else {
        processFn({ thisDef: null, thisPath });
        break;
      }
    }
  }

  protected generateUrlFromPathArr(
    pathArr: string[],
    inputParams: Record<string, any>,
    opts?: { shouldValidate?: boolean },
  ) {
    const shouldValidate = opts?.shouldValidate ?? true;

    const paramTypes = this.getAccumulatedParamTypesAtPath(pathArr, true);

    const pr = validateAndCleanInputParams(inputParams, paramTypes);

    if (!pr.isValid && shouldValidate) {
      throw new NotFoundError({
        msg: pr.errors.join("\n"),
        path: pathArr,
        params: inputParams,
      });
    }

    const cleanedParams = pr.isValid ? pr.params : inputParams;

    const queryStr = Object.keys(cleanedParams).length
      ? `?${queryString.stringify(cleanedParams, { skipNull: true, skipEmptyString: true })}`
      : "";

    const pathStr = pathArr.join("/");

    return pathStr + queryStr;
  }
}

export function parseUrl(url: string) {
  if (url.startsWith("/")) {
    url = url.slice(1);
  }

  const prefix = url.match(/^[^.]+?:\/\//) ? "" : "http://example.com/";

  let { query, pathname } = urlParse(prefix + url);

  if (pathname.startsWith("/")) {
    pathname = pathname.slice(1);
  }

  return { path: pathname.split("/"), params: queryString.parse(query) };
}
