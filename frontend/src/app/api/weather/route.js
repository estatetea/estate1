import { NextResponse } from 'next/server';

function weatherCodeToCondition(code, temp) {
  if (code === 0) return "Clear Sky";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rainy";
  if ([71, 73, 75, 77].includes(code)) return "Snowy";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([85, 86].includes(code)) return "Snow Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  if (temp < 15) return "Cold";
  if (temp < 25) return "Pleasant";
  if (temp < 30) return "Warm";
  return "Hot";
}

function getTeaRecommendation(temperature) {
  if (temperature < 15) return "Hot Estate Classic with ginger and honey — perfect for cold weather warmth";
  if (temperature < 25) return "Hot Estate Premium with cardamom — ideal for this pleasant weather";
  if (temperature < 30) return "Iced Estate Tea with mint and lemon — refreshing for warm weather";
  return "Cold Brew Estate Tea with ice and a hint of lime — stay cool in the heat";
}

export async function POST(request) {
  try {
    const { place, latitude, longitude } = await request.json();
    let lat = latitude, lon = longitude, cityName = place;

    if (lat == null || lon == null) {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en`);
      const geoData = await geoRes.json();
      const results = geoData.results;
      if (!results || results.length === 0) throw new Error("City not found");
      lat = results[0].latitude;
      lon = results[0].longitude;
      cityName = results[0].name || place;
    }

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
    const weatherData = await weatherRes.json();
    const current = weatherData.current || {};
    const temperature = Math.round((current.temperature_2m || 25) * 10) / 10;
    const weatherCode = current.weather_code || 0;

    return NextResponse.json({
      place: cityName,
      temperature,
      condition: weatherCodeToCondition(weatherCode, temperature),
      tea_recommendation: getTeaRecommendation(temperature),
    });
  } catch {
    return NextResponse.json({ place: "Your Location", temperature: 25, condition: "Pleasant", tea_recommendation: "Hot Estate Premium with cardamom — ideal for this pleasant weather" });
  }
}
