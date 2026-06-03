self.addEventListener("push", (event) => {
  let data = { title: "LiveScore", body: "Score update" };
  try {
    if (event.data) data = { ...data, ...JSON.parse(event.data.text()) };
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { roundId: data.roundId },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const roundId = event.notification.data?.roundId;
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      if (list.length) {
        list[0].focus();
        return;
      }
      return clients.openWindow("/");
    })
  );
});
