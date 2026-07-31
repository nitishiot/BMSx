import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Boarders } from "./pages/Boarders";
import { Dashboard } from "./pages/Dashboard";
import { Payments } from "./pages/Payments";
import { Rooms } from "./pages/Rooms";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="boarders" element={<Boarders />} />
        <Route path="payments" element={<Payments />} />
      </Route>
    </Routes>
  );
}
