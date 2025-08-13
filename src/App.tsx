import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home/Home";
import Signin from "./Account/Signin";
import Signup from "./Account/Signup";
import Profile from "./Account/Profile";
import { Provider } from "react-redux";
import { store } from "./store"
import Search from "./Search/search";

export default function App() {
  return (
    <HashRouter>
      <Provider store={store}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              <Home
                isLoggedIn={false}
                user={{ name: "Megan Feng", handle: "meganfeng", avatarUrl: "https://placehold.co/48x48" }}
              />
            }
          />
          <Route path="/Account/Signin" element={<Signin />} />
          <Route path="/Account/Signup" element={<Signup />} />
          <Route path="/Account/Profile" element={<Profile />} />
          <Route path="/Account/Profile/:userId" element={<Profile />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Provider>
    </HashRouter>
  );
}