self.addEventListener("fetch", function (event) {
  // Pass requests straight through — this app doesn't need offline caching,
  // but Chrome's installability check looks for an active fetch handler.
});
self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "SayyaraDrive", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "SayyaraDrive";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(clients.openWindow(url));
});
