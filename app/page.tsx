"use client";
import { useState, useEffect } from 'react';
import { getDistance, getGreatCircleBearing } from 'geolib';
import { CITIES } from './cities';

const getDirectionEmoji = (bearing: number) => {
  const directions = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

export default function Home() {
  // targetCity börjar som null tills sidan har laddats
  const [targetCity, setTargetCity] = useState<any>(null); 
  const [zoom, setZoom] = useState(14);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<any[]>([]);
  const [gameState, setGameState] = useState("playing");
  
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // useEffect körs en gång när sidan laddas för att slumpa en stad
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CITIES.length);
    setTargetCity(CITIES[randomIndex]);
  }, []);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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

  const handleGuess = (e: any) => {
    if (gameState !== "playing" || !guess || !targetCity) return;

    const guessedCity = CITIES.find(c => c.name.toLowerCase() === guess.toLowerCase());

    if (!guessedCity) {
      alert("Välj en stad från listan!");
      return;
    }

    const distance = Math.round(getDistance(
      { latitude: guessedCity.lat, longitude: guessedCity.lon },
      { latitude: targetCity.lat, longitude: targetCity.lon }
    ) / 1000);

    const bearing = getGreatCircleBearing(
      { latitude: guessedCity.lat, longitude: guessedCity.lon },
      { latitude: targetCity.lat, longitude: targetCity.lon }
    );

    const newGuess = {
      name: guessedCity.name,
      distance: distance,
      direction: getDirectionEmoji(bearing)
    };

    const updatedGuesses = [...guesses, newGuess];
    setGuesses(updatedGuesses);
    setGuess("");
    setShowSuggestions(false);

    if (guessedCity.name === targetCity.name) {
      setGameState("won");
    } else if (updatedGuesses.length >= 5) {
      setGameState("lost");
      setZoom(10);
    } else {
      setZoom(zoom - 2);
    }
  };

  // Om målstaden inte har slumpats fram än, visa en laddningsskärm
  if (!targetCity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-sans">
        <h1 className="text-2xl animate-pulse">Laddar spel...</h1>
      </main>
    );
  }

  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${targetCity.lon},${targetCity.lat},${zoom},0,0/800x500?access_token=${token}`;

return (
  <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
    <div className="relative w-full max-w-4xl h-[70vh] overflow-hidden rounded-2xl shadow-2xl border-4 border-white">
      
      {/* KARTAN (Självstängande tagg nu!) */}
      <Map
        initialViewState={{
          longitude: 18.0686,
          latitude: 59.3293,
          zoom: 4
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      />

      {/* TITEL-BOX (Ligger nu utanför Map, men inuti den relativa div-en) */}
      <div className="absolute top-6 left-6 z-10 bg-white/80 backdrop-blur-md p-5 rounded-xl shadow-lg border border-white/50">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">GISSA STADEN 🇸🇪</h1>
        <div className="flex items-center mt-2">
          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500" 
              style={{ width: `${(guesses.length / 6) * 100}%` }}
            ></div>
          </div>
          <span className="ml-3 text-sm font-bold text-gray-700 whitespace-nowrap">
            {6 - guesses.length} liv kvar
          </span>
        </div>
      </div>

      {/* INPUT-BOX (Nere i mitten) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-6">
        <div className="bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-white/50">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={guess}
              onChange={handleInputChange}
              onKeyDown={(e: any) => e.key === 'Enter' && handleGuess(e)}
              placeholder="Skriv in en stad..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-800 font-medium transition-all"
            />
            <button
              onClick={handleGuess}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all"
            >
              Gissa nu!
            </button>
          </div>
        </div>
      </div>

      {/* TIDIGARE GISSNINGAR (Uppe till höger) */}
      {guesses.length > 0 && (
        <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
          {guesses.map((g: any, i: number) => (
            <div key={i} className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-between border border-white/10 min-w-[150px]">
              <span>{g.name}</span>
              <span className="ml-2 text-xs opacity-80">{g.distance}km {g.direction}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  </main>
);
}
