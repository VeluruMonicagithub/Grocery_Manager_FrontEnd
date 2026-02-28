import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ShoppingList from "./pages/ShoppingList";
import Recipes from "./pages/Recipes";
import ProfileAccount from "./pages/ProfileAccount";
import SharingHub from "./pages/SharingHub";
import SharedAccess from "./pages/SharedAccess";
import Analytics from "./pages/Analytics";

import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/shared" element={<SharedAccess />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/list" element={<ProtectedRoute><ShoppingList /></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute><SharingHub /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><ProfileAccount /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
          <ToastContainer position="top-center" autoClose={3000} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;