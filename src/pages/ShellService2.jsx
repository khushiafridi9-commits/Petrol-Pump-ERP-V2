import { Link } from "react-router-dom";
import "./ShellService2.css";

function ShellService2() {
  return (
    <div className="service-page">

      <h1>⛽ Shell Service - II</h1>

      <div className="menu-grid">

        <Link to="/daily-sales-report" className="menu-card">
          📋 Daily Sales Report
        </Link>

        <Link to="/stock" className="menu-card">
         📦 Stock Register
        </Link>

        <Link to="/cash-book" className="menu-card">
          💰 Cash Book
        </Link>

        

        <Link to="/master-rates" className="menu-card">
          ⚙️ Master Rates
        </Link>

        <Link to="/reports" className="menu-card">
          📊 Reports
        </Link>

        <Link to="/credit-ledger" className="menu-card">
          👥 Credit Ledger
        </Link>

         <Link to="/monthly-profit-report" className="menu-card">
         <span className="menu-icon">📈</span>
         <span className="menu-text">Monthly Profit Report</span>
         </Link>

      </div>

    </div>
  );
}

export default ShellService2;