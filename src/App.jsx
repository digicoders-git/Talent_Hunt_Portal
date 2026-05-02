import { BrowserRouter as Router } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { UserProvider } from "./context/UserContext";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
      <ToastContainer position="bottom-center" autoClose={1500} />
    </UserProvider>
  )
}

export default App
