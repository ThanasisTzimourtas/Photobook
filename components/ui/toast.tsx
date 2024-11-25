import React from "react";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
}

export interface ToastActionElement {
  label: string;
  onClick: () => void;
}

export const Toast: React.FC<ToastProps> = ({ title, description, variant = "default", action }) => {
  return (
    <div className={`toast ${variant}`}>
      {title && <strong>{title}</strong>}
      {description && <p>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
