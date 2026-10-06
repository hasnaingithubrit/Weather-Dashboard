const defaultCity = "Lahore";

const weatherApi = "https://api.open-meteo.com/v1/forecast";
const geocodeApi = "https://geocoding-api.open-meteo.com/v1/search";

const locationText = document.getElementById("locationText");
const currentTemp = document.getElementById("currentTemp");
const currentCondition = document.getElementById("currentCondition");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const rainChance = document.getElementById("rainChance");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const timezone = document.getElementById("timezone");
const errorMessage = document.getElementById("errorMessage");
const forecastDays = document.getElementById("forecastDays");
const hourlyForecast = document.getElementById("hourlyForecast");
const cityInput = document.getElementById("cityInput");
const form = document.getElementById("searchForm");

function weatherCodeToText(code) {
  const codes = {
    0: "Clear sky",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Heavy drizzle",
    56: "Light freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Light snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Rain showers",
    81: "Heavy showers",
    82: "Violent showers",
    85: "Snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm"
  };

  return codes[code] || "Unknown";
}

function formatDay(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatHour(dateStr) {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
}

async function getWeather(city) {
  errorMessage.textContent = "";
  try {
    const geocodeRes = await fetch(
      `${geocodeApi}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );

    if (!geocodeRes.ok) {
      throw new Error("Could not find that city.");
    }

    const geocodeData = await geocodeRes.json();
    const cityData = geocodeData.results?.[0];

    if (!cityData) {
      throw new Error("City not found. Try another location.");
    }

    const params = new URLSearchParams({
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
      hourly: "temperature_2m,precipitation_probability,weather_code",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max",
      timezone: "auto",
      forecast_days: 7
    });

    const forecastRes = await fetch(`${weatherApi}?${params.toString()}`);

    if (!forecastRes.ok) {
      throw new Error("Weather API request failed.");
    }

    const weatherData = await forecastRes.json();
    renderWeather(cityData, weatherData);
  } catch (err) {
    errorMessage.textContent = err.message || "Something went wrong.";
  }
}

function renderWeather(cityData, weatherData) {
  const current = weatherData.current;
  const hourly = weatherData.hourly;
  const daily = weatherData.daily;

  locationText.textContent = `${cityData.name}, ${cityData.country}`;
  currentTemp.textContent = `${Math.round(current.temperature_2m)}°C`;
  currentCondition.textContent = weatherCodeToText(current.weather_code);
  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  wind.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  rainChance.textContent = `${Math.round(daily.precipitation_probability_max[0])}%`;

  sunrise.textContent = formatTime(daily.sunrise[0]);
  sunset.textContent = formatTime(daily.sunset[0]);
  timezone.textContent = weatherData.timezone || "UTC";

  forecastDays.innerHTML = "";
  daily.time.forEach((date, index) => {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";

    const maxTemp = Math.round(daily.temperature_2m_max[index]);
    const minTemp = Math.round(daily.temperature_2m_min[index]);
    const condition = weatherCodeToText(daily.weather_code[index]);

    dayCard.innerHTML = `
      <div class="day-date">${formatDay(date)}</div>
      <div class="day-temp">${maxTemp}° / ${minTemp}°</div>
      <div class="day-condition">${condition}</div>
    `;

    forecastDays.appendChild(dayCard);
  });

  hourlyForecast.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const hourCard = document.createElement("div");
    hourCard.className = "hour-card";

    const time = hourly.time[i];
    const temp = Math.round(hourly.temperature_2m[i]);
    const cond = weatherCodeToText(hourly.weather_code[i]);

    hourCard.innerHTML = `
      <div class="hour-time">${formatHour(time)}</div>
      <div class="hour-temp">${temp}°C</div>
      <div class="day-condition">${cond}</div>
    `;

    hourlyForecast.appendChild(hourCard);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    errorMessage.textContent = "Please enter a city name.";
    return;
  }
  getWeather(city);
});

getWeather(defaultCity);
