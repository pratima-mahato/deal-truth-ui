export async function enableMocks(): Promise<void> {
  const { worker } = await import("./browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}
