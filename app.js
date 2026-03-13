// SHARED CONFIG
const KEY = "bdd2f8833eb726760a9d52d4c02475f3";
const BASE = "https://api.openweathermap.org/data/2.5";

/* local variables */
let currentTemp = null;
let currentUnit = "C";
let recentCities = "skyMist_recent_city";
let allRecentCities = "skyMist_all_recent_city";

/* function call at browser loads */
renderRecent();
createCityUrl("new delhi");
updateClock();

/*   ====    FETCH MY CURRENT LOCATION WEATHER    ====    */

function myLocation() {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      createLatLngUrl(position.coords.latitude, position.coords.longitude);
    },
    () => {
      showToast(
        "Location access denied. Please allow location permissions and try again.",
      );
    },
  );
}

/*    ====    pick city name typed by user    ====    */
function citySearch() {
  const v = document.getElementById("searchInput").value.trim();
  if (!v) {
    showToast("Please enter a city name to search.");
    return;
  }
  createCityUrl(v);
}

function createCityUrl(city) {
  let weatherURl = `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${KEY}&units=metric`;
  let forecastURl = `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${KEY}&units=metric`;
  fetchWeatherDetails(weatherURl, forecastURl);
}

function createLatLngUrl(lat, lng) {
  let weatherURl = `${BASE}/weather?lat=${lat}&lon=${lng}&appid=${KEY}&units=metric`;
  let forecastURl = `${BASE}/forecast?lat=${lat}&lon=${lng}&appid=${KEY}&units=metric`;
  fetchWeatherDetails(weatherURl, forecastURl);
}

/*    ====    Fetch weather details    ====   */
function fetchWeatherDetails(weatherURl, forecastURl) {
  showLoader();

  Promise.all([fetch(weatherURl), fetch(forecastURl)])
    .then((responses) => Promise.all(responses.map((res) => res.json())))
    .then(([weatherData, forecastData]) => {
      if (weatherData.cod != 200) {
        throw new Error(weatherData.message);
      } else if (forecastData.cod != 200) {
        throw new Error(forecastData.message);
      }
      hideLoader();
      displayWeatherDetails(weatherData, forecastData);
    })
    .catch((err) => {
      hideLoader();
      showToast(err.message || "Could not get weather for your location.");
    });
}

/*  wd = weather data  fd = forecast data */
function displayWeatherDetails(wd, fd) {
  // set city name on search box
  document.getElementById("searchInput").value = wd.name;

  // save to both recent lists
  addRecentCityName(wd.name);
  addAllRecentCities(wd.name);

  // set temp data
  currentTemp = Math.round(wd.main.temp);
  updateTempDisplay();
  checkAlert(currentTemp);

  // city and country name
  const parts = wd.name.split(" "),
    last = parts.pop();
  const cityHtml =
    (parts.length ? parts.join(" ") + " " : "") +
    `<em class="text-[var(--accent)]">${last}</em>`;
  document.getElementById("city").innerHTML = cityHtml;
  document.getElementById("country").innerText = wd.sys.country;

  // weather condition icon and text
  const code = wd.weather[0].icon;
  document.getElementById("condIcon").textContent = ic(code);
  document.getElementById("condName").textContent =
    wd.weather[0].description.replace(/\b\w/g, (c) => c.toUpperCase());

  // weather stats
  document.getElementById("wH").textContent = wd.main.humidity + "%";
  document.getElementById("wW").textContent = wd.wind.speed + " m/s";
  document.getElementById("wF").textContent =
    Math.round(wd.main.feels_like) + "°C";
  document.getElementById("wV").textContent = wd.visibility
    ? (wd.visibility / 1000).toFixed(1) + " km"
    : "—";
  document.getElementById("wP").textContent = wd.main.pressure + " hPa";

  // render 5-day forecast
  renderForecast(fd);
}

/* ═══════════════════════════════════════
   5-DAY FORECAST
═══════════════════════════════════════ */

function renderForecast(fd) {
  const grid = document.getElementById("fcGrid");

  // api returns 40 entries (every 3hr)
  // we pick the best entry per day — prefer noon (12:00:00)
  const dailyMap = {};

  fd.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0]; // "2026-03-12"
    const hour = item.dt_txt.split(" ")[1]; // "12:00:00"

    // save first entry of the day, overwrite if noon entry found
    if (!dailyMap[date] || hour === "12:00:00") {
      dailyMap[date] = item;
    }
  });

  // convert object to array and take only 5 days
  const days = Object.values(dailyMap).slice(0, 5);

  grid.innerHTML = days
    .map((day) => {
      // dt is unix timestamp in seconds — JS needs milliseconds so × 1000
      const date = new Date(day.dt * 1000);

      // format day name: "Wed"
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      // format date string: "12 Mar"
      const dateStr = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });

      // get emoji icon from icon code e.g. "01d" → "☀️"
      const icon = ic(day.weather[0].icon);

      // capitalize each word of description
      const desc = day.weather[0].description.replace(/\b\w/g, (c) =>
        c.toUpperCase(),
      );
      console.log(day.main);

      const tempMax = Math.round(day.main.temp_max);
      const humidity = day.main.humidity;
      const wind = day.wind.speed;

      return `
        <div class="fc-card">
          <div class="fc-day">${dayName} ${dateStr}</div>
          <div class="fc-icon">${icon}</div>
          <div class="fc-max">${tempMax}° C</div>
          <div class="fc-desc">${desc}</div>
          <div class="fc-divider"></div>
          <div class="fc-stats">
            <span>💧 ${humidity}%</span>
            <span>💨 ${wind} m/s</span>
          </div>
        </div>
      `;
    })
    .join("");
}

/* ═══════════════════════════════════════
   RECENT CITIES  (chips below search)
═══════════════════════════════════════ */

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(recentCities) || "[]");
  } catch {
    return [];
  }
}

function addRecentCityName(city) {
  let recent = getRecent();
  recent = recent.filter((c) => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  if (recent.length > 8) recent = recent.slice(0, 8);
  localStorage.setItem(recentCities, JSON.stringify(recent));
  renderRecent();
}

function renderRecent() {
  const wrapper = document.getElementById("recentWrapper");
  const arr = getRecent();

  if (!arr.length) {
    wrapper.innerHTML = "";
    return;
  }

  wrapper.innerHTML = arr
    .map(
      (city) => `
      <div class="recentCityName cursor-pointer"
           onclick="searchCity('${city.replace(/'/g, "\\'")}')">
        ${city}
      </div>`,
    )
    .join("");
}

/* ═══════════════════════════════════════
   ALL RECENT CITIES  (used in dropdown)
═══════════════════════════════════════ */

function getAllRecentCities() {
  try {
    return JSON.parse(localStorage.getItem(allRecentCities) || "[]");
  } catch {
    return [];
  }
}

function addAllRecentCities(city) {
  let recent = getAllRecentCities();
  recent = recent.filter((c) => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  localStorage.setItem(allRecentCities, JSON.stringify(recent));
}

/* ═══════════════════════════════════════
   DROPDOWN
═══════════════════════════════════════ */

const cityInput = document.getElementById("searchInput");

// Show all recent cities when input is focused
cityInput.addEventListener("focus", () => {
  populateDropdown(getAllRecentCities());
});

// Filter cities as user types
cityInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    citySearch();
    hideDropdown();
    return;
  }

  const query = cityInput.value.trim().toLowerCase();
  const cities = getAllRecentCities();

  if (!query) {
    populateDropdown(cities);
    return;
  }

  const filtered = cities.filter((c) => c.toLowerCase().includes(query));
  populateDropdown(filtered);
});

// Hide dropdown when clicking outside input or dropdown
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("dropDownList");
  if (!cityInput.contains(e.target) && !dropdown.contains(e.target)) {
    hideDropdown();
  }
});

// Fill dropdown content then show it
function populateDropdown(cities) {
  const dropdown = document.getElementById("dropDownList");

  if (!cities.length) {
    hideDropdown();
    return;
  }

  dropdown.innerHTML = cities
    .map(
      (city) => `
      <div class="dd-item"
           onclick="searchCity('${city.replace(/'/g, "\\'")}')">
        <span class="dd-icon">🕐</span> ${city}
      </div>`,
    )
    .join("");

  showDropdown();
}

function showDropdown() {
  document.getElementById("dropDownList").classList.remove("hidden");
}

function hideDropdown() {
  document.getElementById("dropDownList").classList.add("hidden");
}

// Search city from dropdown click or recent chip click
function searchCity(name) {
  document.getElementById("searchInput").value = name;
  hideDropdown();
  createCityUrl(name);
}

/* ═══════════════════════════════════════
   TOAST
═══════════════════════════════════════ */

function showToast(msg) {
  document.getElementById("toastMsg").textContent = msg;
  document.getElementById("toast").classList.remove("hidden");
  setTimeout(closeToast, 4000);
}

function closeToast() {
  document.getElementById("toast").classList.add("hidden");
}

/* ═══════════════════════════════════════
   RAIN
═══════════════════════════════════════ */

function createRain() {
  const container = document.createElement("div");
  container.classList.add("rain-container");
  container.id = "rain-container";

  for (let i = 0; i < 80; i++) {
    const drop = document.createElement("div");
    drop.classList.add("drop");
    drop.style.left = Math.random() * 100 + "vw";
    drop.style.animationDuration = 0.5 + Math.random() * 1 + "s";
    drop.style.animationDelay = Math.random() * 2 + "s";
    drop.style.opacity = 0.3 + Math.random() * 0.5;
    drop.style.height = 10 + Math.random() * 20 + "px";
    container.appendChild(drop);
  }

  document.body.appendChild(container);
}

function removeRain() {
  const existing = document.getElementById("rain-container");
  if (existing) existing.remove();
}

/* ═══════════════════════════════════════
   LOADER
═══════════════════════════════════════ */

function showLoader() {
  document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

/* ═══════════════════════════════════════
   TEMPERATURE UNIT TOGGLE
═══════════════════════════════════════ */

const btnC = document.getElementById("btnC");
const btnF = document.getElementById("btnF");

function setUnit(unit) {
  currentUnit = unit;
  if (unit === "C") {
    btnC.classList.add("active");
    btnF.classList.remove("active");
  } else {
    btnF.classList.add("active");
    btnC.classList.remove("active");
  }
  updateTempDisplay();
}

function updateTempDisplay() {
  if (currentTemp === null) return;
  const temp =
    currentUnit === "C"
      ? Math.round(currentTemp)
      : Math.round((currentTemp * 9) / 5 + 32);
  document.getElementById("tempDisplay").textContent = `${temp}°`;
}

/* ═══════════════════════════════════════
   ICON MAP
═══════════════════════════════════════ */

const IM = {
  "01d": "☀️",
  "01n": "🌙",
  "02d": "⛅",
  "02n": "⛅",
  "03d": "☁️",
  "03n": "☁️",
  "04d": "🌥️",
  "04n": "🌥️",
  "09d": "🌧️",
  "09n": "🌧️",
  "10d": "🌧️",
  "10n": "🌧️",
  "11d": "⛈️",
  "11n": "⛈️",
  "13d": "❄️",
  "13n": "❄️",
  "50d": "🌫️",
  "50n": "🌫️",
};
const ic = (c) => IM[c] || "🌡️";

/* ═══════════════════════════════════════
   CLOCK
═══════════════════════════════════════ */

function updateClock() {
  const n = new Date();
  document.getElementById("liveTime").textContent = n.toLocaleTimeString(
    "en-US",
    { hour12: false },
  );
  document.getElementById("liveDate").textContent = n
    .toLocaleDateString("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}
setInterval(updateClock, 1000);

/* ═══════════════════════════════════════
   ALERT BAR
═══════════════════════════════════════ */

function checkAlert(tc) {
  const b = document.getElementById("alertBar");
  if (tc >= 40) {
    document.getElementById("alertTxt").textContent =
      `Extreme heat! ${tc}°C — stay hydrated and seek shade immediately.`;
    document.getElementById("alertIcon").textContent = "🔥";
    b.classList.add("show");
  } else if (tc <= -10) {
    document.getElementById("alertTxt").textContent =
      `Extreme cold! ${tc}°C — dress in layers and limit outdoor exposure.`;
    document.getElementById("alertIcon").textContent = "🥶";
    b.classList.add("show");
  } else {
    b.classList.remove("show");
  }
}
