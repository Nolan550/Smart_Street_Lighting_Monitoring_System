import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

function MainLayout({ children }) {
  return (
    <div>
      <Sidebar />

      <div
        style={{
          marginLeft: '270px',
          padding: '20px'
        }}
      >
        <Navbar />

        {children}
      </div>
    </div>
  );
}

export default MainLayout;