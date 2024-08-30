import React, { createContext, useContext, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already authenticated
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = () => {
    // Redirect to GitHub OAuth login
    window.location.href = 'https://github.com/login/oauth/authorize?client_id=YOUR_GITHUB_CLIENT_ID&redirect_uri=http://localhost:3000/callback';
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleAuthCallback = async (code) => {
    try {
      // Exchange code for access token (this should be done on your backend)
      const response = await fetch('YOUR_BACKEND_AUTH_ENDPOINT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, handleAuthCallback }}>
      {children}
      {!user && (
        <div className="fixed top-4 right-4">
          <Button onClick={login}>Login with GitHub</Button>
        </div>
      )}
      {user && (
        <div className="fixed top-4 right-4 flex items-center space-x-2">
          <span>Welcome, {user.name}</span>
          <Button onClick={logout}>Logout</Button>
        </div>
      )}
    </AuthContext.Provider>
  );
};