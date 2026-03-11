// SHARED CONFIG
const KEY = "bdd2f8833eb726760a9d52d4c02475f3";
const BASE = "https://api.openweathermap.org/data/2.5";

/* local variables */
let currentTemp = null,
  currentUnit = "C";

/*   ====    FETCH MY CURRENT LOCATION WEATHER    ====    */

function myLocation() {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    //success
    (position) => {
      fetchWeatherDetails(position.coords.latitude, position.coords.longitude);
    }, // failure
    () => {
      showToast(
        "Location access denied. Please allow location permissions and try again.",
      );
    },
  );
}

/*    ====    Fetch weather details from coords    ====   */

function fetchWeatherDetails(lat, lng) {
  showLoader();
  let weatherURl = `${BASE}/weather?lat=${lat}&lon=${lng}&appid=${KEY}&units=metric`;
  let forecastURl = `${BASE}/forecast?lat=${lat}&lon=${lng}&appid=${KEY}&units=metric`;

  Promise.all([fetch(weatherURl), fetch(forecastURl)])
    .then((responses) => Promise.all(responses.map((res) => res.json())))
    .then(([weatherData, forecastData]) => {
      hideLoader();
      // render(cw, fc);
      displayWeatherDetails(weatherData, forecastData);
      // addRecent(cw.name);
    })
    .catch((err) => {
      hideLoader();
      showToast(err.message || "Could not get weather for your location.");
    });
}
/*  wd = weather data fd= forecast data*/
function displayWeatherDetails(wd, fd) {
  // set city name on search box
  document.getElementById("searchInput").value = wd.name;
  //set temp data
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
  //weather condition icon and text
  const code=wd.weather[0].icon;
  document.getElementById("condIcon").textContent = ic(code);
  document.getElementById('condName').textContent=wd.weather[0].description.replace(/\b\w/g,c=>c.toUpperCase());
  //all the 5 weather conditions
  document.getElementById('wH').textContent=wd.main.humidity+'%';
  document.getElementById('wW').textContent=wd.wind.speed+' m/s';
  document.getElementById('wF').textContent=Math.round(wd.main.feels_like)+'°C';
  document.getElementById('wV').textContent=wd.visibility?(wd.visibility/1000).toFixed(1)+' km':'—';
  document.getElementById('wP').textContent=wd.main.pressure+' hPa';
}

/* Toast */
function showToast(msg) {
  document.getElementById("toastMsg").textContent = msg;
  document.getElementById("toast").classList.remove("hidden");

  // auto hide after 4 seconds
  setTimeout(closeToast, 4000);
}

function closeToast() {
  document.getElementById("toast").classList.add("hidden");
}

// rain drop
function createRain() {
  const container = document.createElement("div");
  container.classList.add("rain-container");
  container.id = "rain-container";

  for (let i = 0; i < 80; i++) {
    const drop = document.createElement("div");
    drop.classList.add("drop");

    // Random position, speed, delay for each drop
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

//searched city name drop down list
const dropdown = document.getElementById("dropDownList");

// show
dropdown.classList.remove("hidden");

// hide
dropdown.classList.add("hidden");

// data loader indicator
function showLoader() {
  document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

// handle temp unit change
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

/* Icon map */
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
updateClock();
setInterval(updateClock, 1000);

/* ═══════════════════════════════════════
   Alert
═══════════════════════════════════════ */

function checkAlert(tc) {
  tc = -12;
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
