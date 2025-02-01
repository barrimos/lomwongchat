import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import LoginPage from '../Pages/LoginPage/LoginPage'
import LomwongPage from '../Pages/LomwongPage/LomwongPage'
import ErrorPage from '../Pages/ErrorPage/ErrorPage'
import HelpDeskPage from '../Pages/HelpDeskPage/HelpDeskPage'
import DisputeResolution from '../Pages/HelpDeskPage/DisputeResolution'
import Dashboard from '../Pages/Dashboard/Dashboard'
import LoginPageDashboard from '../Pages/LoginPage/LoginPageDashboard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LoginPage /> }, // Default route for `/`
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/adsysop',
    children: [
      { index: true, element: <LoginPageDashboard /> }, // Default route for `/adsysop`
      { path: ':username', element: <Dashboard /> },
    ],
  },
  {
    path: '/lomwong',
    children: [
      { path: ':yourName/:paramsChannel', element: <LomwongPage /> },
      {
        path: 'helps/:username',
        element: <HelpDeskPage />,
        children: [
          { path: ':ticket', element: <HelpDeskPage /> }, // Specify the component for tickets
        ],
      },
    ],
  },
  {
    path: '/disputeresolution/:code/:username/:user?',
    element: <DisputeResolution />,
  },
  {
    path: '/error',
    element: <ErrorPage />,
  },
  {
    path: '*', // Catch-all route for undefined paths
    element: <ErrorPage />,
  },
])