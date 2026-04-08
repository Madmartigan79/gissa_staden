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
  const [targetCity, setTargetCity] = useState(null); 
  const [zoom, setZoom] = useState(14);
  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState([]);
  const [gameState, setGameState] = useState("playing");
  
  const [filteredCities, setFilteredCities] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // useEffect körs en gång när sidan laddas för att slumpa en stad
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CITIES.length);
    setTargetCity(CITIES[randomIndex]);
  }, []);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleInputChange = (e) => {
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

  const handleSuggestionClick = (cityName) => {
    setGuess(cityName);
    setShowSuggestions(false);
  };

  const handleGuess = () => {
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
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-950 text-white font-sans">
      <h1 className="text-5xl font-black mb-2 tracking-tighter">GISSA STADEN</h1>
      <p className="text-slate-400 mb-8 font-medium text-lg">{5 - guesses.length} försök kvar.</p>
      
      <div className="relative mb-8 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <img 
          src={mapUrl} 
          alt="Satellitvy" 
          className="relative w-[800px] h-[500px] object-cover rounded-xl shadow-2xl border border-white/10"
        />
        
        {gameState !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm animate-in fade-in duration-500">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-2">
                {gameState === "won" ? "Snyggt! 🎉" : "Spelet slut! 💀"}
              </h2>
              <p className="text-xl">Rätt stad var: <span className="font-bold text-cyan-400">{targetCity.name}</span></p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-cyan-400 transition-colors"
              >
                Spela igen
              </button>
            </div>
          </div>
        )}
      </div>

      {gameState === "playing" && (
        <div className="flex gap-3 mb-10 w-full max-w-md relative">
          <div className="relative flex-1">
            <input 
              type="text"
              className="w-full px-5 py-4 bg-slate-900 border-2 border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 text-lg transition-all shadow-inner"
              value={guess}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
              placeholder="Vilken stad är det här?"
            />
            
            {showSuggestions && filteredCities.length > 0 && (
              <ul className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-xl mt-2 z-10 max-h-48 overflow-y-auto shadow-xl">
                {filteredCities.map((city) => (
                  <li 
                    key={city.name} 
                    onClick={() => handleSuggestionClick(city.name)}
                    className="px-5 py-3 cursor-pointer hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    {city.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button 
            onClick={handleGuess}
            className="bg-cyan-600 hover:bg-cyan-500 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95"
          >
            Gissa
          </button>
        </div>
      )}

      <div className="w-full max-w-md space-y-3">
        {guesses.map((g, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl animate-in slide-in-from-bottom-2">
            <span className="font-bold text-lg">{g.name}</span>
            <div className="flex items-center gap-4">
              <span className="text-slate-400">{g.distance} km</span>
              <span className="text-2xl">{g.direction}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
