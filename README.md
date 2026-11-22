# Neumann Gerüstbau Website

Vorschau der neuen Website für die Neumann Gerüstbau GmbH, Berlin.
Statische Seite ohne Build: HTML, CSS, JavaScript. Die Scroll-Animation besteht aus 121 Einzelbildern in `assets/frames`.

## Version 6: realistischer Look, Sonnenwetter (22.11.2026)
- Stadt neu in Blender Cycles mit Poly Haven Scans: echte Dachziegel und Schiefer mit Rinnen, Gauben und Solarmodulen, Asphalt mit Abrieb, Fassaden in 2048 mit Fensterlaibungen.
- Park mit 3D Gras, Blumen, Hecken, Büschen, Wegen mit Granitkanten, Brunnen und Bänken. Berliner Laternen, Kanaldeckel, Baumscheiben.
- Licht: blauer Himmel (Sky Texture), Sonne 32° von der Seite, AgX Punchy, leichter Dunst und Bloom.
- Alle Bildfolgen (Sturzflug, Gerüstfahrt, Abbau) und die Fahrzeuge der Live-Ansicht neu gerendert. Skripte: `08_Blender/stadt_look.py`, `render_stadt/alles2.sh`.
