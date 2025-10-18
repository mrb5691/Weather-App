import React from "react";
import Weather from "./components/Weather";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Weather — React + TypeScript</h1>
        <p className="sub">Search a city or use your location</p>
      </header>

      <main className="container">
        <Weather />
      </main>

      <footer className="footer">
        <small>Data from OpenWeatherMap • Built with Vite + React + TS</small>
      </footer>
    </div>
  );
}
