# Neumann Gerüstbau Website

Vorschau der neuen Website für die Neumann Gerüstbau GmbH, Berlin.
Statische Seite ohne Build: HTML, CSS, JavaScript. Die Scroll-Animation besteht aus 121 Einzelbildern in `assets/frames`.

## Version 7: goldenes Licht, Berliner Dächer, volle Höfe (22.11.2026)
- Licht nach Naders Referenzbildern: tiefe goldene Sonne (18 Grad), warme Fassaden, kühle tiefe Schatten.
- Dächer: Berliner Mansarden mit Gauben und dunklem Flachteil, gealterte Ziegel und Schiefer in vielen Varianten, Schornsteinreihen aus Backstein, Dachrinnen, Dachfenster.
- Fassaden in Pastelltönen je Haus (Terrakotta, Lachs, Creme, Mint), Hofbalkone, Erker.
- Höfe und Park: geschnittene Hecken, dichte Büsche, Beete, Sitzgruppen, viele große Hofbäume mit eigenem Grün.
- Fehler behoben: eine alte Dachfunktion hatte die neue überschrieben (keine Gauben, keine Rinnen); Strauchmodelle waren von oben unsichtbar.
- Skripte: 08_Blender/stadt.py, stadt_look.py; Render: render_stadt/alles3.sh, Ordner anflug3, plate3, bg_stadt3, bg_neu_stadt3, fg3, sprites3.

## Version 6: realistischer Look, Sonnenwetter (22.11.2026)
- Stadt neu in Blender Cycles mit Poly Haven Scans: echte Dachziegel und Schiefer mit Rinnen, Gauben und Solarmodulen, Asphalt mit Abrieb, Fassaden in 2048 mit Fensterlaibungen.
- Park mit 3D Gras, Blumen, Hecken, Büschen, Wegen mit Granitkanten, Brunnen und Bänken. Berliner Laternen, Kanaldeckel, Baumscheiben.
- Licht: blauer Himmel (Sky Texture), Sonne 32° von der Seite, AgX Punchy, leichter Dunst und Bloom.
- Alle Bildfolgen (Sturzflug, Gerüstfahrt, Abbau) und die Fahrzeuge der Live-Ansicht neu gerendert. Skripte: `08_Blender/stadt_look.py`, `render_stadt/alles2.sh`.
