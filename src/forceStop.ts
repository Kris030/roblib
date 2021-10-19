import { init, move } from "./lib";

init(process.env["ROBLIB_IP"] || "192.168.0.1:5000").then(() => move());

console.log("STOPPING ROBOT");
