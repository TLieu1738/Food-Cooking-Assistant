import React, { useState } from 'react';
import './styles.css';
import Login from './pages/Login'
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Log from './pages/Log';
import Ingredients from './pages/Ingredients'
import Goals from './pages/Goals';

export default function App() {
  const [page, setPage] = useState('login');

  function navigate(to) {
    setPage(to);
    window.scrollTo(0, 0);
  }

  return (
    <div>
      {page === 'login'   && <Login   navigate={navigate} />}
      {page === 'home'    && <Home    navigate={navigate} />}
      {page === 'scanner' && <Scanner navigate={navigate} />}
      {page === 'ingredients' && <Ingredients navigate={navigate} />}
      {page === 'log'     && <Log     navigate={navigate} />}
      {page === 'goals'   && <Goals   navigate={navigate} />}
    </div>
  );
}
