import { AppProvider, useApp } from "./contexts/AppContext";
import LoginScreen from "./screens/LoginScreen";
import ConnectArcaScreen from "./screens/ConnectArcaScreen";
import AppScreen from "./screens/AppScreen";

function ScreenRouter() {
  const { screen } = useApp();

  if (screen === "login") return <LoginScreen />;
  if (screen === "connect-arca") return <ConnectArcaScreen />;
  return <AppScreen />;
}

export default function Deduxi() {
  return (
    <AppProvider>
      <ScreenRouter />
    </AppProvider>
  );
}
