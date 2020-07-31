import { ProviderOptions, FlavoredProviderOptions } from "./provider-options";
import { Server } from "http";

type ServerFrameworkOptions = {
  /**
   * The number of milliseconds of inactivity the http server needs to wait for
   * additional incoming data, after it has finished writing the last response,
   * before a socket will be destroyed. This does not affect the websocket
   * server.
   *
   * A value of 0 will disable the keep-alive timeout behavior on incoming connections. Defaults to `5000`
   */
  keepAliveTimeout?: number;

  /**
   * Port number to listen on when running as a server. Defaults to `8545`
   */
  port?: number;

  /**
   * Enable a websocket server. This is `true` by default.
   */
  ws?: boolean;
}

type ServerOptions = ProviderOptions & ServerFrameworkOptions;
type FlavoredServerOptions = FlavoredProviderOptions & ServerFrameworkOptions;

export {
  ServerOptions,
  FlavoredServerOptions
};
