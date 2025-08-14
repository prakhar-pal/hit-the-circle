interface NotificationOptions {
  variant?: "success" | "error" | "info";
  time?: number;
}
let previousNotificationTimeoutId: ReturnType<typeof setTimeout> | null = null;
export function showNotification(
  text: string,
  { variant = "success", time = 2000 }: NotificationOptions,
) {
  const notificationContainer = document.getElementById("app-notification");
  const notificationEl = document.createElement("div");
  let styleProperties: Partial<CSSStyleDeclaration> | null = null;
  switch (variant) {
    case "success": {
      styleProperties = {
        backgroundColor: "green",
        color: "white",
      };
      break;
    }
    case "error": {
      styleProperties = {
        backgroundColor: "red",
        color: "white",
      };
      break;
    }
    case "info": {
      styleProperties = {
        backgroundColor: "gray",
        color: "white",
      };
      break;
    }
  }
  if (notificationContainer) {
    Object.assign(notificationEl.style, styleProperties);
  }
  notificationEl.innerHTML = text;
  notificationContainer?.append(notificationEl);
  notificationContainer?.classList.remove("d-none");
  if (previousNotificationTimeoutId) {
    clearTimeout(previousNotificationTimeoutId);
  }
  previousNotificationTimeoutId = setTimeout(() => {
    notificationContainer?.classList.add("d-none");
  }, time);
  setTimeout(() => {
    notificationEl.remove();
  }, time);
}
