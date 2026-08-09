import { Link } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <h1>AL HAJ PETROLEUM SERVICES</h1>
        <h2>ERP DASHBOARD</h2>
      </div>

      <div className="dashboard-grid">

        <Link to="/shell-service-2" className="dashboard-card">
          <div className="icon">⛽</div>
          <h3>Shell Service - II</h3>
          <p>Open Shell ERP</p>
        </Link>

        <Link to="/service-3" className="dashboard-card">
          <div className="icon">⛽</div>
          <h3>PGL Service - III</h3>
          <p>Open PGL ERP</p>
        </Link>

        

      </div>

    </div>
  );
}

export default Dashboard;