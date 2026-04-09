"use client";

import React, { useState, useEffect } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as geolib from "geolib";
import { CITIES } from "./cities";

const MapAny = Map as any;
const MarkerAny = Marker as any;

export default function Home() {
  const [targetCity, setTargetCity] = useState<any>(null);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // STARTZOOM ÄNDRAD TILL 16.5 (för att se byggnader tydligt)
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 16.5 
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CITIES.length);
    const selected = CITIES[randomIndex];
    setTargetCity(selected);
    
    setViewState({
      longitude: selected.lon,
      latitude: selected.lat,
      zoom: 16.5
    });
  }, []);

  const handleInputChange = (e: any) => {
    const value = e.target.value;
    setGuess(value);

    if (value.length > 0) {
      const filtered = CITIES.filter((city) =>
        // Bytte ut .startsWith mot .includes här nedanför!
        city.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (cityName: any) => {
    setGuess(cityName);
    setShowSuggestions(false);
  };

  const getDirectionEmoji = (bearing: number) => {
    if (bearing >= 337.5 || bearing < 22.5) return "⬆️";
    if (bearing >= 22.5 && bearing < 67.5) return "↗️";
    if (bearing >= 67.5 && bearing < 112.5) return "➡️";
    if (bearing >= 112.5 && bearing < 157.5) return "↘️";
    if (bearing >= 157.5 && bearing < 202.5) return "⬇️";
    if (bearing >= 202.5 && bearing < 247.5) return "↙️";
    if (bearing >= 247.5 && bearing < 292.5) return "⬅️";
    return "↖️";
  };

  const handleGuess = (e?: any) => {
    if (e) e.preventDefault();
    if (!guess || gameOver) return;

    const guessedCity = CITIES.find(
      (c) => c.name.toLowerCase() === guess.toLowerCase()
    );

    if (guessedCity && targetCity) {
      const distance = Math.round(
        geolib.getDistance(
          { latitude: guessedCity.lat, longitude: guessedCity.lon },
          { latitude: targetCity.lat, longitude: targetCity.lon }
        ) / 1000
      );

      const bearing = geolib.getGreatCircleBearing(
        { latitude: guessedCity.lat, longitude: guessedCity.lon },
        { latitude: targetCity.lat, longitude: targetCity.lon }
      );

      const newGuess = {
        name: guessedCity.name,
        distance,
        direction: getDirectionEmoji(bearing),
      };

      const updatedGuesses = [...guesses, newGuess];
      setGuesses(updatedGuesses);
      setGuess("");
      setShowSuggestions(false);

      // ÄNDRAT TILL 5 FÖRSÖK
      if (guessedCity.name === targetCity.name || updatedGuesses.length >= 5) {
        setGameOver(true);
        setViewState({
          longitude: 0,
          latitude: 20,
          zoom: 1.5
        });
      } else {
        // Justerad utzoomning för att passa den nya startnivån
        setViewState((prevState) => ({
          ...prevState,
          zoom: Math.max(prevState.zoom - 2.5, 2)
        }));
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 font-sans">
      <div className="relative w-full max-w-6xl h-[90vh] overflow-hidden rounded-3xl shadow-2xl border-4 border-white bg-gray-200">
        
        {targetCity && (
          <MapAny
            {...viewState}
            onMove={(evt: any) => setViewState(evt.viewState)}
            dragPan={false}
            scrollZoom={false}
            doubleClickZoom={false}
            touchZoomRotate={false}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/satellite-v9"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          >
            {guesses.map((g: any, i: number) => {
              const cityData = CITIES.find((c) => c.name === g.name);
              if (!cityData) return null;
              return (
                <MarkerAny key={i} longitude={cityData.lon} latitude={cityData.lat}>
                  <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                </MarkerAny>
              );
            })}

            {gameOver && (
              <MarkerAny longitude={targetCity.lon} latitude={targetCity.lat}>
                <div className="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center z-50 animate-bounce">
                  ⭐
                </div>
              </MarkerAny>
            )}
          </MapAny>
        )}

        <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/50">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">GISSA STADEN 🌍</h1>
          <div className="flex items-center mt-3">
            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-700" 
                // PROGRESS BAR JUSTERAD TILL 5
                style={{ width: `${(guesses.length / 5) * 100}%` }}
              ></div>
            </div>
            <span className="ml-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
              {5 - guesses.length} försök kvar
            </span>
          </div>
        </div>

        {!gameOver && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-6">
            <div className="bg-white/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/50">
              <div className="relative">
                <input
                  type="text"
                  value={guess}
                  onChange={handleInputChange}
                  onKeyDown={(e: any) => e.key === 'Enter' && handleGuess(e)}
                  placeholder="Vilken stad?"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-500 focus:outline-none text-gray-800 font-bold transition-all placeholder:text-gray-400"
                />
                
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="absolute bottom-full mb-2 w-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 max-h-48 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleSuggestionClick(city.name)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 text-gray-700 font-medium transition-colors"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleGuess}
                className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transform active:scale-95 transition-all uppercase tracking-widest text-sm"
              >
                Gissa!
              </button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 backdrop-blur-sm px-6">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full">
              <h2 className="text-3xl font-black text-gray-900 mb-2">
                {guesses[guesses.length - 1]?.name === targetCity?.name ? "🎉 RÄTT!" : "⌛ SLUT!"}
              </h2>
              <p className="text-gray-600 mb-6 font-medium">
                Staden var <span className="text-blue-600 font-bold">{targetCity?.name}</span>.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors uppercase tracking-widest shadow-lg"
              >
                Spela igen
              </button>
            </div>
          </div>
        )}

        <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 items-end">
          {guesses.map((g: any, i: number) => (
            <div key={i} className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-3 border border-white/10">
              <span className="uppercase tracking-wide">{g.name}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{g.distance}km</span>
              <span>{g.direction}</span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
