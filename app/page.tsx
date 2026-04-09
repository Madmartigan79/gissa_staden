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

  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 20,
    zoom: 13.5 
  });

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CITIES.length);
    const selected = CITIES[randomIndex];
    setTargetCity(selected);
    
    setViewState({
      longitude: selected.lon,
      latitude: selected.lat,
      zoom: 13.5
    });
  }, []);

  const handleInputChange = (e: any) => {
    const value = e.target.value;
    setGuess(value);
    if (value.length > 0) {
      const filtered = CITIES.filter((city) =>
        city.name.toLowerCase().startsWith(value.toLowerCase())
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

    const guessedCity = CITIES.find((c) => c.name.toLowerCase() === guess.toLowerCase());

    if (guessedCity && targetCity) {
      const distance = Math.round(geolib.getDistance(
        { latitude: guessedCity.lat, longitude: guessedCity.lon },
        { latitude: targetCity.lat, longitude: targetCity.lon }
      ) / 1000);

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

      if (guessedCity.name === targetCity.name || updatedGuesses.length >= 6) {
        setGameOver(true);
        // VID SPELSLUT: Zooma ut så man ser hela världen (zoom 1.5)
        setViewState({
          longitude: 0,
          latitude: 20,
          zoom: 1.5
        });
      } else {
        // VID FEL GISSNING: Zooma ut mer aggressivt eftersom det är globalt
        setViewState((prevState) => ({
          ...prevState,
          zoom: Math.max(prevState.zoom - 2, 2) 
        }));
      }
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-900 font-sans">
      <div className="relative w-full max-w-7xl h-[92vh] overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-zinc-800">
        
        {targetCity && (
          <MapAny
            {...viewState}
            onMove={(evt: any) => setViewState(evt.viewState)}
            dragPan={false}
            scrollZoom={false}
            doubleClickZoom={false}
            touchZoomRotate={false}
            style={{ width: '100%', height: '100%' }}
            // VIKTIGT: mapStyle ändrad till satellite-v9 (utan gator)
            mapStyle="mapbox://styles/mapbox/satellite-v9"
            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          >
            {guesses.map((g: any, i: number) => {
              const cityData = CITIES.find((c) => c.name === g.name);
              if (!cityData) return null;
              return (
                <MarkerAny key={i} longitude={cityData.lon} latitude={cityData.lat}>
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg shadow-red-500/50"></div>
                </MarkerAny>
              );
            })}

            {gameOver && (
              <MarkerAny longitude={targetCity.lon} latitude={targetCity.lat}>
                <div className="w-10 h-10 bg-green-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center z-50 animate-bounce">
                  🚩
                </div>
              </MarkerAny>
            )}
          </MapAny>
        )}

        {/* UI Overlay */}
        <div className="absolute top-8 left-8 z-10 bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 text-white">
          <h1 className="text-3xl font-black tracking-tighter italic">GEO GUESSER PRO</h1>
          <div className="flex items-center mt-4">
            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-400 transition-all duration-1000" 
                style={{ width: `${(guesses.length / 6) * 100}%` }}
              ></div>
            </div>
            <span className="ml-4 text-xs font-black opacity-60 uppercase tracking-tighter">
              Try {guesses.length + 1} of 6
            </span>
          </div>
        </div>

        {!gameOver && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-8">
            <div className="bg-black/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
              <div className="relative">
                <input
                  type="text"
                  value={guess}
                  onChange={handleInputChange}
                  onKeyDown={(e: any) => e.key === 'Enter' && handleGuess(e)}
                  placeholder="Guess the city..."
                  className="w-full bg-white/10 px-6 py-4 rounded-2xl border border-white/5 focus:border-green-400 focus:outline-none text-white font-bold placeholder:text-white/20 transition-all"
                />
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="absolute bottom-full mb-4 w-full bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 max-h-56 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => handleSuggestionClick(city.name)}
                        className="w-full px-6 py-3 text-left hover:bg-white/5 text-white/80 font-bold border-b border-white/5 last:border-0"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleGuess}
                className="w-full mt-4 py-4 bg-green-500 hover:bg-green-400 text-black font-black rounded-2xl shadow-lg shadow-green-500/20 transition-all uppercase tracking-widest"
              >
                Submit Guess
              </button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md px-8">
            <div className="bg-zinc-900 p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center max-w-sm w-full">
              <h2 className="text-4xl font-black text-white mb-2 italic">
                {guesses[guesses.length - 1]?.name === targetCity?.name ? "ELITE" : "FAILED"}
              </h2>
              <p className="text-white/60 mb-8 font-bold">
                Location: <span className="text-green-400">{targetCity?.name}</span>
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        <div className="absolute top-8 right-8 z-10 flex flex-col gap-3 items-end">
          {guesses.map((g: any, i: number) => (
            <div key={i} className="bg-white/5 backdrop-blur-md text-white px-5 py-3 rounded-2xl text-sm font-black flex items-center gap-4 border border-white/5">
              <span className="uppercase opacity-40">{i+1}</span>
              <span className="tracking-tighter">{g.name}</span>
              <span className="text-green-400">{g.distance}km</span>
              <span>{g.direction}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
