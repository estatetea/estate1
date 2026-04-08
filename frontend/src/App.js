import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import EntryForm from "./components/EntryForm";
import MainStore from "./components/MainStore";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  const handleEntrySubmit = async (data) => {
    try {
      const response = await axios.post(`${API}/weather`, { place: data.place });
      setWeatherData(response.data);
      setUserInfo(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
      toast.error("Could not fetch weather data");
    }
  };

  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      {!userInfo ? (
        <EntryForm onSubmit={handleEntrySubmit} />
      ) : (
        <MainStore userInfo={userInfo} weatherData={weatherData} />
      )}
    </div>
  );
}

export default App;