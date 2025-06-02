import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Todo from "./components/Todo";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user, logout } = useAuth();
  return (
    <Router>
      <div className="app">
        {user && (
          <div style={{ textAlign: "right", margin: "1rem 2rem 0 0" }}>
            <span
              style={{ marginRight: 12, color: "#357ae8", fontWeight: 600 }}
            >
              {user.username}
            </span>
            <button
              onClick={logout}
              style={{
                padding: "0.5rem 1.2rem",
                borderRadius: 8,
                border: "none",
                background: "#ff4f4f",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Todo />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
