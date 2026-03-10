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
let currentTempC = null;
let currentUnit = "C";

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
  if (currentTempC === null) return;

  const temp = currentUnit === "C"
    ? Math.round(currentTempC)
    : Math.round((currentTempC * 9 / 5) + 32);

  document.getElementById("tempDisplay").textContent = `${temp}°`;
}
