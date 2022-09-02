import type { ReactNode } from "react";
import type { ScreenProps } from "react-native-screens";
import { Simplify } from "type-fest";
import { ParamsTypeRecord } from "../implementations/params.js";

export type RouteDef = StackRouteDef | SwitchRouteDef | LeafRouteDef;

export type RouteDefWithoutUI = StackRouteDefWithoutUI | SwitchRouteDefWithoutUI | LeafRouteDefWithoutUI;

export type RouteDefWithUIOnly = StackRouteDefWithUIOnly | SwitchRouteDefWithUIOnly | LeafRouteDefWithUIOnly;

export type RouteDefFromMerge<T extends RouteDefWithoutUI> = T extends StackRouteDefWithoutUI
  ? Simplify<
      Omit<T, "routes"> &
        StackRouteDefWithUIOnly & { routes: { [K in keyof T["routes"]]: RouteDefFromMerge<T["routes"][K]> } }
    >
  : T extends SwitchRouteDefWithoutUI
  ? Simplify<
      Omit<T, "routes"> &
        SwitchRouteDefWithUIOnly & { routes: { [K in keyof T["routes"]]: RouteDefFromMerge<T["routes"][K]> } }
    >
  : Simplify<T & LeafRouteDefWithUIOnly>;

type CommonRouteDefWithUIOnly = {
  unstable_rn_childScreenProps?: ScreenProps;
  unstable_rn_screenProps?: ScreenProps;
  Wrapper?: MultiTypeComponentWithChildren;
};

type CommonRouteDefWithoutUI = {
  params?: ParamsTypeRecord;
};

type CommonRouteDef = Simplify<CommonRouteDefWithUIOnly & CommonRouteDefWithoutUI>;

export type StackRouteDef = {
  type: "stack";
  initialRoute?: string;
} & StackAndSwitchDefBase;

type StackAndSwitchDefBase = {
  NotFound404?: (p: { path: string; params: Record<string, string | number> }) => JSX.Element | null;
  routes: { [routePath in string]: RouteDef };
} & CommonRouteDef;

export type StackRouteDefWithoutUI = Simplify<
  CommonRouteDefWithoutUI &
    Pick<StackRouteDef, "type"> & {
      routes: { [routePath in string]: RouteDefWithoutUI };
    }
>;

export type StackRouteDefWithUIOnly = Simplify<
  CommonRouteDefWithUIOnly & Pick<StackRouteDef, "type" | "initialRoute" | "NotFound404">
>;

export type SwitchRouteDef = {
  type: "switch";
  keepChildrenMounted?: boolean;
  initialRoute?: string;
} & StackAndSwitchDefBase;

export type SwitchRouteDefWithoutUI = Simplify<
  CommonRouteDefWithoutUI &
    Pick<SwitchRouteDef, "type"> & {
      routes: { [routePath in string]: RouteDefWithoutUI };
    }
>;

export type SwitchRouteDefWithUIOnly = Simplify<
  CommonRouteDefWithUIOnly & Pick<SwitchRouteDef, "type" | "initialRoute" | "keepChildrenMounted" | "NotFound404">
>;

export type LeafRouteDef = Simplify<
  {
    type: "leaf";
    Component: MultiTypeComponent;
  } & Omit<CommonRouteDef, "unstable_rn_childScreenProps">
>;

export type MultiTypeComponent<Props = {}> = ((a: Props) => ReactNode) | React.FC<Props> | React.Component<Props>;

type MultiTypeComponentWithChildren = (a: { children: ReactNode }) => JSX.Element | null;

export type LeafRouteDefWithoutUI = Simplify<Pick<LeafRouteDef, "type"> & CommonRouteDefWithoutUI>;
export type LeafRouteDefWithUIOnly = Simplify<Pick<LeafRouteDef, "Component" | "type"> & CommonRouteDefWithUIOnly>;
