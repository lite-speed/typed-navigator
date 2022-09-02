import { InferParamsOutput, ParamsTypeRecord as ParamsTypeRecord } from "../implementations/params.js";
import { RouteDef, StackRouteDef, SwitchRouteDef } from "./routes.js";

type RouteDefRecord = Record<string, RouteDef>;

type ParamsValueRecord<T extends ParamsTypeRecord> = InferParamsOutput<T>;

export type StackNavigationState<
  K extends string | number | symbol,
  ParamsType extends ParamsTypeRecord | undefined,
  RouteRecord extends RouteDefRecord,
> = {
  type: "stack";
  path: K;
  params?: ParamsType extends ParamsTypeRecord ? ParamsValueRecord<ParamsType> : undefined;
  infoForRenderingNotFoundError?: InfoForRenderingNotFoundError;
  stack: InnerNavigationStateRecord<RouteRecord>[];
};

export type SwitchNavigationState<
  K extends PropertyKey,
  ParamsType extends ParamsTypeRecord | undefined,
  RouteRecord extends RouteDefRecord,
> = {
  type: "switch";
  path: K;
  params?: ParamsType extends ParamsTypeRecord ? ParamsValueRecord<ParamsType> : undefined;
  infoForRenderingNotFoundError?: InfoForRenderingNotFoundError;
  focusedSwitchIndex: number;
  switches: InnerNavigationStateRecord<RouteRecord>[];
};

export type LeafNavigationState<K extends PropertyKey, ParamsType extends ParamsTypeRecord | undefined> = {
  type: "leaf";
  path: K;
  infoForRenderingNotFoundError?: InfoForRenderingNotFoundError;
  params?: ParamsType extends ParamsTypeRecord ? ParamsValueRecord<ParamsType> : undefined;
};

export type InnerNavigationState =
  | LeafNavigationState<any, any>
  | SwitchNavigationState<any, any, any>
  | StackNavigationState<any, any, any>;

type InnerNavigationStateRecord<ThisRouteDefRecord extends RouteDefRecord> = {
  [K in keyof ThisRouteDefRecord]: ThisRouteDefRecord[K] extends StackRouteDef
    ? StackNavigationState<K, ThisRouteDefRecord[K]["params"], ThisRouteDefRecord[K]["routes"]>
    : ThisRouteDefRecord[K] extends SwitchRouteDef
    ? SwitchNavigationState<K, ThisRouteDefRecord[K]["params"], ThisRouteDefRecord[K]["routes"]>
    : LeafNavigationState<K, ThisRouteDefRecord[K]["params"]>;
}[keyof ThisRouteDefRecord];

export type RootNavigationState<T extends RouteDef> = T extends SwitchRouteDef
  ? {
      type: "root-switch";
      focusedSwitchIndex: number;
      infoForRenderingNotFoundError?: InfoForRenderingNotFoundError;
      switches: InnerNavigationStateRecord<T["routes"]>[];
    }
  : T extends StackRouteDef
  ? {
      type: "root-stack";
      infoForRenderingNotFoundError?: InfoForRenderingNotFoundError;
      stack: InnerNavigationStateRecord<T["routes"]>[];
    }
  : never;

/**
 * An array that maps _exactly_ to a nav state path, suitable for accessing or setting with lodash.
 * Is composed of triplets of form: `['stack', number, string]` where the third value is the route name
 * E.g. `_.get(rootNavState, someAbsNavStatePath)`
 * E.g. `_.set(rootNavState, someAbsNavStatePath, someDeepStateVal)`
 */
export type AbsNavStatePath = (number | string)[];

type InfoForRenderingNotFoundError = { origPath: string[]; origParams: any };
