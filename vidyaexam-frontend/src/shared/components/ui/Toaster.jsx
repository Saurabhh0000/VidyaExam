import { Toaster as SonnerToaster } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import "./toaster.css";

const toastIcons = {
  success: <CheckCircle2 size={20} strokeWidth={2.2} />,
  error: <XCircle size={20} strokeWidth={2.2} />,
  warning: <AlertTriangle size={20} strokeWidth={2.2} />,
  info: <Info size={20} strokeWidth={2.2} />,
  loading: <Info size={20} strokeWidth={2.2} />,
};

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      richColors={false}
      expand={false}
      visibleToasts={4}
      duration={4000}
      theme="light"
      icons={toastIcons}
      toastOptions={{
        className: "vidya-toast",
        classNames: {
          success: "vidya-toast-success",
          error: "vidya-toast-error",
          warning: "vidya-toast-warning",
          info: "vidya-toast-info",
          loading: "vidya-toast-loading",
          closeButton: "vidya-toast-close",
        },
      }}
    />
  );
}
