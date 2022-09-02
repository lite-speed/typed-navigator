import { ParamsTypeRecord } from "./params.js";

export class NotFoundError extends Error {
  path: string[];
  params?: ParamsTypeRecord;

  constructor(a: { msg: string; path: string[]; params?: ParamsTypeRecord }) {
    super(a.msg);
    this.path = a.path;
    this.params = a.params;
  }
}
