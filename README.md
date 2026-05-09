# GH Tracker

*GH Tracker* is a **companion app** for Gloomhaven-based board games.

It manages scenario play by tracking character progression, party achievements, and campaign milestones in a single shared state.

Supports:

- **Gloomhaven**
- **Frosthaven**
- **Jaws of the Lion**
- **Forgotten Circles**
- **Gloomhaven 2nd Edition**
- **Button & Bugs**
- **The Crimson Scales**
- **Trail of Ashes**
- and more...

Runs in any modern browser, supports multi-client sync via [GHT Server](https://github.com/CIvanPiMa/ght-server).

## Getting Started

> [!Tip]
>
> See [docs/installation.md](./docs/installation.md) for the full guide.
> This section is just a quickstart to get you up and running in dev mode.

1. Spin up the app and server
   - Clone the server repo (next to this one, not inside it):

    ```bash
    git clone https://github.com/CIvanPiMa/ght-server.git -o ../GHT-server
    ```

   - Run the Dev Docker Compose:

   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

2. Open the app at `http://localhost:4200`

3. Connect to the server:

   1. In the app → hamburger menu → **Connect to Server**
   2. Set **Host** to `localhost`
   3. Set **Port** to `4201`
   4. Enter any UUID as the **Room Code** (this is your game credential, so keep it safe!)
   5. Click **Connect**
      1. Keep the "Secure" toggle off for local network connections;

---

Forked from [Lurkars/gloomhavensecretariat](https://github.com/Lurkars/gloomhavensecretariat)
