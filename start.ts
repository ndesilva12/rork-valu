import app from "./hono";

const port = Number(process.env.PORT || 8081);

(async () => {
  try {
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`Backend listening at http://localhost:${port}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start backend:", err);
    process.exit(1);
  }
})();