import AppRouter from "./router";
import Toaster from "../shared/components/ui/Toaster";

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}
