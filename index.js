const apiKey = '5513775501bd23fbecfc41e10aeb6a9a';

// Function to generate HTML for one day's weather
function oneDayWeatherHtmlElement(weatherData, city) {
    if (weatherData === 'city not found' || !weatherData) {
        return `<h2>You Entered an Incorrect City Name</h2>`;
    }

    return `
        <div class="weather-item featured-location">
            <div class="weather-location-name-wrapper">
                <div class="recent-location-name">${city}</div>
                <div class="recent-location-date">${weatherData.day}</div>
            </div>
            <div class="recent-location-current-weather-wrapper">
                <img class="weather-icon" src="${weatherData.icon}" width="32" height="32">
                <span class="weather-temp">${weatherData.temp} <span class="weather-location-temp-unit">°C</span></span>
            </div>
            <div class="additional-weather-info">
                <div class="weather-condition">
                    Condition: <span class="weather-condition-text">${weatherData.weather_condition}</span>
                </div>
                <div class="humidity">
                    Humidity: <span class="humidity-value">${weatherData.humidity}%</span>
                </div>
                <div class="wind-speed">
                    Wind Speed: <span class="wind-speed-value">${weatherData.wind_speed} m/s</span>
                </div>
            </div>
            <div class="hourly-forecast">
                <h3>Hourly Forecast</h3>
                <div class="hourly-forecast-list">
                    ${weatherData.hourly_info.map(e => `
                        <div class="hourly-item">
                            <span class="hour">${e.time}</span>
                            <img class="hourly-icon" src="${e.icon}" alt="Weather icon" width="24" height="24"/>
                            <span class="hourly-temp">${e.temp}°C</span>
                            <span class="hourly-high-low">H: ${e.high_temp}°C / L: ${e.low_temp}°C</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
}

// Capitalize city name for consistency
function capitalizeCityName(city) {
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
}

// Display weather data for a specified city
async function displayWeather(city) {
    city = capitalizeCityName(city);
    const forecastContainer = document.querySelector('.featured-locations__locations');
    forecastContainer.innerHTML = '';

    const weatherData = await fetchForecastData(city);

    if (weatherData === 'city not found') {
        forecastContainer.innerHTML = `<h2>You Entered an Incorrect City Name</h2>`;
    } else {
        const oneDayWeather = groupWeatherDataByDay(weatherData);
        const todayWeather = formatWeatherData(oneDayWeather[0], "Today");
        const otherDaysInfo = oneDayWeather.slice(1, 5).map((day, i) => formatWeatherData(day, `${addDays(new Date(), i+1)}`));

        forecastContainer.innerHTML = oneDayWeatherHtmlElement(todayWeather, city);
        otherDaysInfo.forEach(day => {
            forecastContainer.innerHTML += oneDayWeatherHtmlElement(day, city);
        });
    }
}

// Group weather data by day
function groupWeatherDataByDay(weatherData) {
    let lastDate = weatherData.list[0].dt_txt.substring(0, 10);
    let groupedData = [[weatherData.list[0]]];

    for (let i = 1; i < weatherData.list.length; i++) {
        const currentDate = weatherData.list[i].dt_txt.substring(0, 10);
        if (currentDate !== lastDate) {
            lastDate = currentDate;
            groupedData.push([weatherData.list[i]]);
        } else {
            groupedData[groupedData.length - 1].push(weatherData.list[i]);
        }
    }
    return groupedData;
}

// Format weather data into a structured object
function formatWeatherData(dayData, dayLabel) {
    const mainData = dayData[0];
    return {
        day: dayLabel,
        temp: mainData.main.temp,
        humidity: mainData.main.humidity,
        wind_speed: mainData.wind.speed,
        icon: `https://openweathermap.org/img/wn/${mainData.weather[0].icon}.png`,
        weather_condition: mainData.weather[0].main,
        hourly_info: dayData.map(entry => ({
            time: entry.dt_txt.substring(11, 16),
            temp: entry.main.temp,
            high_temp: entry.main.temp_max,
            low_temp: entry.main.temp_min,
            icon: `https://openweathermap.org/img/wn/${entry.weather[0].icon}.png`
        }))
    };
}

// Event listeners for search and location buttons
const searchBtn = document.querySelector(".button.search button");
const inputField = document.querySelector(".search-input");
const locationBtn = document.querySelector(".button.use_current_location button");

if (searchBtn && inputField && locationBtn) {
    searchBtn.addEventListener("click", (event) => {
        event.preventDefault();
        if (inputField.value.trim() !== "") {
            displayWeather(inputField.value.trim());
        } else {
            alert("Please enter a location.");
        }
    });

    inputField.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (inputField.value.trim() !== "") {
                displayWeather(inputField.value.trim());
            } else {
                alert("Please enter a location.");
            }
        }
    });

    locationBtn.addEventListener("click", (event) => {
        event.preventDefault();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                displayWeatherByCoordinates(latitude, longitude);
            }, (error) => {
                alert("Unable to retrieve your location.");
                console.error(error);
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    });
} else {
    console.error("Search button, input field, or location button not found.");
}

async function fetchForecastData(query, coords = null) {
    try {
        // Define the URL based on query type (city or coordinates)
        let url;
        if (coords) {
            const { latitude, longitude } = coords;
            url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&lang=en&appid=${apiKey}`;
        } else {
            url = `https://api.openweathermap.org/data/2.5/forecast?q=${query}&units=metric&lang=en&appid=${apiKey}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        return data.cod === "200" ? data : 'city not found';
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return 'city not found';
    }
}

// Display weather based on coordinates
async function displayWeatherByCoordinates(latitude, longitude) {
    const coords = { latitude, longitude };
    const weatherData = await fetchForecastData(null, coords);

    const forecastContainer = document.querySelector('.featured-locations__locations');
    forecastContainer.innerHTML = ''; // Clear previous data

    if (weatherData === 'city not found') {
        forecastContainer.innerHTML = `<h2>Unable to retrieve weather data for your location</h2>`;
    } else {
        const city = weatherData.city.name;
        const oneDayWeather = groupWeatherDataByDay(weatherData);
        const todayWeather = formatWeatherData(oneDayWeather[0], "Today");
        const otherDaysInfo = oneDayWeather.slice(1, 5).map((day, i) => formatWeatherData(day, `${addDays(new Date(), i+1)}`));

        // Display today’s weather and other days
        forecastContainer.innerHTML = oneDayWeatherHtmlElement(todayWeather, city);
        otherDaysInfo.forEach(day => {
            forecastContainer.innerHTML += oneDayWeatherHtmlElement(day, city);
        });
    }
}
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.getDate() + '.' + (result.getMonth() + 1) + '.' + result.getFullYear();
}

async function fetchCitySuggestions(cityName) {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=5&appid=${apiKey}`);
    const data = await response.json();
    return data.map(city => `${city.name}, ${city.country}`);

}

let resultsContainer = document.querySelector('.results-container');

inputField.addEventListener("input", async (event) => {
    const suggestions = await fetchCitySuggestions(inputField.value);

    resultsContainer.style.display = 'flex';
    resultsContainer.style.flexDirection = 'column';
    resultsContainer.innerHTML = '';
    console.log(suggestions)

    suggestions.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className= 'search-bar-result';
        cityElement.textContent = city;
        cityElement.addEventListener("click", () => {
            inputField.value = city;
            resultsContainer.style.display = 'none';
            displayWeather(city.split(',')[0]);
        });
        resultsContainer.appendChild(cityElement);
    });
});
