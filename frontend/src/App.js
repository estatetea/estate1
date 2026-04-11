import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import axios from "axios";
import { Toaster } from "sonner";
import EntryForm from "./components/EntryForm";
import MainStore from "./components/MainStore";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import WelcomeScreen from "./components/WelcomeScreen";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [cart, setCart] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);

  const handleEntrySubmit = async (data) => {
    setUserInfo(data);
    setShowWelcome(true);

    // Only fetch weather if location was detected
    if (data.place) {
      try {
        const response = await axios.post(`${API}/weather`, { place: data.place });
        setWeatherData(response.data);
      } catch (error) {
        console.error("Error fetching weather:", error);
        // Proceed without weather data — store will show both options
        setWeatherData(null);
      }
    } else {
      setWeatherData(null);
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  return (
    <div className="App">
      <Toaster position="top-center" richColors />
      {showWelcome && userInfo && (
        <WelcomeScreen userName={userInfo.name} onComplete={handleWelcomeComplete} />
      )}
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              !userInfo ? (
                <EntryForm onSubmit={handleEntrySubmit} />
              ) : (
                <Navigate to="/store" replace />
              )
            } 
          />
          <Route 
            path="/store" 
            element={
              userInfo ? (
                <MainStore 
                  userInfo={userInfo} 
                  weatherData={weatherData} 
                  cart={cart}
                  setCart={setCart}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/cart" 
            element={
              userInfo ? (
                <Cart 
                  cart={cart} 
                  setCart={setCart}
                  userInfo={userInfo}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/checkout" 
            element={
              userInfo ? (
                <Checkout 
                  cart={cart}
                  userInfo={userInfo}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;