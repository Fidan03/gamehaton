# Seeded demo media

Drop pre-gathered clips/screenshots for your demo game here, then register them
in `manifest.json`, keyed by the game's slug (lowercase, spaces → dashes):

```json
{
  "elden-ring": [
    { "type": "video", "path": "/seeded/elden-ring/boss-fight.mp4" },
    { "type": "image", "path": "/seeded/elden-ring/vista.jpg" }
  ]
}
```

Seeded media is shown first when composing a recap for that game. If a game has
no seeded entry, the collector falls back to the game's official Steam
screenshots and trailer automatically — so seeding is optional polish, not a
requirement.
