self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  event.waitUntil(
    self.registration.showNotification(data.title || "Nouvelle notification", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: {
        url: data.url || "/"
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});
