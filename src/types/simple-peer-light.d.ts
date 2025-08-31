// src/types/simple-peer-light.d.ts
declare module "simple-peer-light" {
  import { Instance as SimplePeerInstance, Options } from "simple-peer";

  export default class SimplePeer extends SimplePeerInstance {
    constructor(opts?: Options);
  }
}
