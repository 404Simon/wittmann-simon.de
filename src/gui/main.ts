import "./style.css";
import { render } from "./pages.ts";

render();
window.addEventListener("hashchange", render);
