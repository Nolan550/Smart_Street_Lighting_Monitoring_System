import { Link } from 'react-router-dom';
function Sidebar() {
  return (
    <div
      style={{
        width: '250px',
        background: '#1e293b',
        color: 'white',
        height: '100vh',
        padding: '20px',
        position: 'fixed',
        left: 0,
        top: 0
      }}
    >
      <h2>Smart Street Lights</h2>

      <hr />

      <ul
  style={{
    listStyle: 'none',
    padding: 0
  }}
>
  <li style={{ padding: '15px 0' }}>
    <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
      Dashboard
    </Link>
  </li>

  <li style={{ padding: '15px 0' }}>
    <Link to="/streetlights" style={{ color: 'white', textDecoration: 'none' }}>
      Street Lights
    </Link>
  </li>

  <li style={{ padding: '15px 0' }}>
    <Link to="/energy" style={{ color: 'white', textDecoration: 'none' }}>
      Energy Monitoring
    </Link>
  </li>

  <li style={{ padding: '15px 0' }}>
    <Link to="/faults" style={{ color: 'white', textDecoration: 'none' }}>
      Faults
    </Link>
  </li>

  <li style={{ padding: '15px 0' }}>
    <Link to="/reports" style={{ color: 'white', textDecoration: 'none' }}>
      Reports
    </Link>
  </li>

  <li style={{ padding: '15px 0' }}>
    <Link to="/zones" style={{ color: 'white', textDecoration: 'none' }}>
      Zones
    </Link>
  </li>

  

<li style={{ padding: '15px 0' }}>
  <Link
    to="/scheduling"
    style={{ color: 'white', textDecoration: 'none' }}
  >
    Scheduling
  </Link>

  </li>
</ul>
    </div>
  );
}

export default Sidebar;