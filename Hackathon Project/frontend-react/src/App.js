import React, { useState } from 'react';
import './styles.css';
import Login from './pages/Login'
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Log from './pages/Log';
import Ingredients from './pages/Ingredients'
import Goals from './pages/Goals';
import Chat from './pages/Chat';
import Friends from './pages/Friends';
import Profile from './pages/Profile';

export default function App() {
  const [page, setPage] = useState(localStorage.getItem('token') ? 'home' : 'login');

  function navigate(to) {
    setPage(to);
    window.scrollTo(0, 0);
  }

  return (
    <div>
      {page === 'login'       && <Login       navigate={navigate} />}
      {page === 'home'        && <Home        navigate={navigate} />}
      {page === 'scanner'     && <Scanner     navigate={navigate} />}
      {page === 'ingredients' && <Ingredients navigate={navigate} />}
      {page === 'log'     && <Log     navigate={navigate} />}
      {page === 'goals'   && <Goals   navigate={navigate} />}
      {page === 'chat'        && <Chat        navigate={navigate} />}
      {page === 'friends'        && <Friends        navigate={navigate} />}
      {page === 'profile'     && <Profile navigate={navigate} />}
    </div>
  );
}
