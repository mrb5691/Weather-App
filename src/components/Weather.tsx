import React, { useState, useEffect, type FormEvent } from "react";

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY as string;
const BASE_CUR = "https://api.openweathermap.org/data/2.5/weather";
const BASE_FORECAST = "https://api.openweathermap.org/data/2.5/forecast";

interface CurrentWeather {
  city: string;
  country?: string;
  temp: number;
  feels: number;
  desc: string;
  icon: string;
  humidity: number;
  wind: number;
}

interface ForecastItem {
  date: string;
  temp: number;
  desc: string;
  icon: string;
  humidity: number;
}

interface ForecastResponse {
  list: {
    dt_txt: string;
    main: { temp: number; humidity: number };
    weather: { description: string; icon: string }[];
  }[];
}

interface CurrentResponse {
  name: string;
  sys: { country: string };
  main: { temp: number; feels_like: number; humidity: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
}

export default function Weather() {
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("Houston");
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  async function loadByCity(q: string) {
    if (!q) return;
    setLoading(true);
    setError("");

    try {
      const cur = await fetchJson<CurrentResponse>(
        `${BASE_CUR}?q=${encodeURIComponent(q)}&units=imperial&appid=${API_KEY}`
      );
      const fc = await fetchJson<ForecastResponse>(
        `${BASE_FORECAST}?q=${encodeURIComponent(q)}&units=imperial&appid=${API_KEY}`
      );

      setCurrent(parseCurrent(cur));
      setForecast(parseForecast(fc));
      setQuery(q);
    } catch (err) {
      console.error(err);
      setError("Could not load weather data. Please check the city name.");
    } finally {
      setLoading(false);
    }
  }

  async function loadByCoords(lat: number, lon: number) {
    setLoading(true);
    setError("");

    try {
      const cur = await fetchJson<CurrentResponse>(
        `${BASE_CUR}?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
      );
      const fc = await fetchJson<ForecastResponse>(
        `${BASE_FORECAST}?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
      );

      setCurrent(parseCurrent(cur));
      setForecast(parseForecast(fc));
      setQuery(`${cur.name}, ${cur.sys.country}`);
    } catch (err) {
      console.error(err);
      setError("Could not load weather for your location.");
    } finally {
      setLoading(false);
    }
  }

  function parseCurrent(c: CurrentResponse): CurrentWeather {
    return {
      city: c.name,
      country: c.sys.country,
      temp: Math.round(c.main.temp),
      feels: Math.round(c.main.feels_like),
      desc: c.weather[0].description,
      icon: c.weather[0].icon,
      humidity: c.main.humidity,
      wind: c.wind.speed,
    };
  }

  function parseForecast(fc: ForecastResponse): ForecastItem[] {
    const map = new Map<string, any>();

    for (const item of fc.list) {
      const date = item.dt_txt.split(" ")[0];
      const time = item.dt_txt.split(" ")[1];
      const diff = Math.abs(parseInt(time.split(":")[0], 10) - 12);

      const existing = map.get(date);
      if (!existing || diff < existing.diff) {
        map.set(date, { ...item, diff });
      }
    }

    const today = new Date().toISOString().split("T")[0];
    return Array.from(map.entries())
      .filter(([date]) => date !== today)
      .slice(0, 5)
      .map(([date, item]) => ({
        date,
        temp: Math.round(item.main.temp),
        desc: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
      }));
  }

  useEffect(() => {
    loadByCity(query);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (city.trim()) loadByCity(city.trim());
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => loadByCoords(pos.coords.latitude, pos.coords.longitude),
      () => setError("Unable to access location.")
    );
  }

  return (
    <section className="weather-card">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          placeholder="Enter city (e.g. London)"
          value={city}
          onChange={e => setCity(e.target.value)}
        />
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            Search
          </button>
          <button type="button" onClick={handleUseLocation} disabled={loading}>
            Use My Location
          </button>
        </div>
      </form>

      {loading && <div className="status">Loading...</div>}
      {error && <div className="error">{error}</div>}

      {current && !loading && (
        <div className="current">
          <div>
            <h2>
              {current.city}
              {current.country && `, ${current.country}`}
            </h2>
            <p className="desc">{current.desc}</p>
            <div className="temps">
              <div className="temp-main">{current.temp}°F</div>
              <div className="temp-sub">
                Feels {current.feels}° • Humidity {current.humidity}% • Wind{" "}
                {current.wind} mph
              </div>
            </div>
          </div>
          <img
            src={`https://openweathermap.org/img/wn/${current.icon}@2x.png`}
            alt={current.desc}
            width="80"
            height="80"
          />
        </div>
      )}

      {forecast.length > 0 && !loading && (
        <div className="forecast">
          {forecast.map(day => (
            <div className="day" key={day.date}>
              <div className="day-date">
                {new Date(day.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                alt={day.desc}
                width="60"
                height="60"
              />
              <div className="day-temp">{day.temp}°F</div>
              <div className="day-desc">{day.desc}</div>
              <div className="day-hum">Humidity {day.humidity}%</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}