import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { DataIntegrity, FeatureReport, HomeLayout, OobPercentage, UpgradeConflict } from './pages';
import StartHealthCheck from './pages/StartHealthCheck';
import Dashboard from './pages/Dashboard';

const router = createHashRouter([
  {
    path: '/',
    element: <HomeLayout />,
    children: [
      { index: true, element: <FeatureReport /> },
      { path: 'data-integrity', element: <DataIntegrity /> },
      { path: 'oob-conflict', element: <OobPercentage /> },
      { path: 'upgrade-conflict', element: <UpgradeConflict /> },
    ],
  },
  { path: 'start-health-check', element: <StartHealthCheck /> },
  { path: 'dashboard', element: <Dashboard /> },
]);

const App = () => {
  return (
    <RouterProvider router={router} />
  );
};

export default App;
