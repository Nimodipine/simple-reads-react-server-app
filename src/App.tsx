import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home/Home";
import Signin from "./Account/Signin";
import Signup from "./Account/Signup";
import Profile from "./Account/Profile";
import Search from "./Search/search";
import BookInfo from "./Search/bookinfo";
import { Provider } from "react-redux";
import { store } from "./store";
import UserManagement from "./UserManagement";
import UserProfileList from "./UserProfileLink";


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
          <Route path="/users-list" element={<UserProfileList />} />
          <Route path="/users" element={<UserManagement />} />
          {/* Add the book details route */}
          <Route path="/details/:googleId" element={<BookInfo />} />
          {/* Optional: You can also add the alternative route pattern */}
          <Route path="/book/:googleId" element={<BookInfo />} />
        </Routes>
      </Provider>
    </HashRouter>
  );
}