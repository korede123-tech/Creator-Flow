import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { JoinPage, joinPageCode } from "./components/JoinPage";
import "./index.css";

import { BrowserRouter as Router } from "react-router-dom";

const path = window.location.pathname;
const code = joinPageCode();

if (code) {
  createRoot(document.getElementById("root")!).render(<JoinPage code={code} />);
} else {
  createRoot(document.getElementById("root")!).render(
    <Router>
      <App />
    </Router>
  );
}
