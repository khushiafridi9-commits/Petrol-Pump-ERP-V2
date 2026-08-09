import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import ShellService2 from "./pages/ShellService2";
import DailySalesReport from "./pages/DailySalesReport";
import MasterRates from "./pages/MasterRates";
import MonthlyProfitReport from "./pages/MonthlyProfitReport";
import Stock from "./pages/Stock";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/master-rates"
          element={<MasterRates />}
        />

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/shell-service-2"
          element={<ShellService2 />}
        />

        <Route
          path="/daily-sales-report"
          element={<DailySalesReport />}
        />

        <Route
          path="/monthly-profit-report"
          element={<MonthlyProfitReport />}
        />

        <Route
          path="/stock"
          element={<Stock />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;