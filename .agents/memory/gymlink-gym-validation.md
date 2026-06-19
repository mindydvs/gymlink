---
name: GymLink gym validation (OpenStreetMap)
description: Why/how GymLink validates user-added gyms against OpenStreetMap instead of Google Maps
---

# Add-a-gym validation uses OpenStreetMap Nominatim

GymLink lets users add a gym they're at. To stop arbitrary made-up text from
becoming a "gym", the server validates against real-world places.

**Decision:** Use OpenStreetMap Nominatim (`nominatim.openstreetmap.org`), not Google Maps.
**Why:** Free, no API key, no billing. The owner (Mindy) is non-technical and we
avoided making her set up a Google Cloud billing account. Nominatim requires a
descriptive `User-Agent` header (set in `gymSearch.ts`) — without it requests get
blocked.

**How it works / how to apply:**
- Search and add are two steps. `GET /gyms/search?q=` returns OSM candidates;
  `POST /gyms` takes only `{osmType, osmId}` and **re-validates** via OSM lookup
  before persisting. Clients can never POST free-text gym names — that's the whole
  anti-abuse mechanism. Keep it that way.
- A result only counts as a gym if it's tagged as a fitness venue
  (`leisure=fitness_centre/sports_centre`, `amenity=gym`, `sport=fitness`).
- Dedupe by deterministic id `osm-<type>-<id>` with `onConflictDoNothing`.
- Nominatim is rate-limited / can be slow — calls have an AbortController timeout.
  When deduping web results against existing gyms in the UI, match on OSM id, NOT
  name — chains (e.g. several Gold's Gyms in Austin) share a name but are distinct
  places; name-matching wrongly hides legitimate branches.
