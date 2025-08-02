import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { Builder } from "./pages/Builder";
import { Health } from "./pages/Health";
import { Security } from "./pages/Security";
import { parseXml } from "./steps";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/health" element={<Health />} />
        <Route path="/security" element={<Security />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
