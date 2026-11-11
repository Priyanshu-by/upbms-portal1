import http from "node:http";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Windows Node binds "localhost" to ::1 only. Chrome then gets
// ERR_CONNECTION_REFUSED when it tries 127.0.0.1. Listen on both.
const listen = http.Server.prototype.listen;
http.Server.prototype.listen = function (port, host, callback) {
  if (typeof port === "number" && (host === "::" || host === "localhost")) {
    return listen.call(this, { port, host: "::", ipv6Only: false }, callback);
  }
  return listen.apply(this, arguments);
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: "::",
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:5000",
      "/uploads": "http://127.0.0.1:5000"
    }
  }
});
