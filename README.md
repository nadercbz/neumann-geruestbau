# Neumann Gerüstbau Website

Vorschau der neuen Website für die Neumann Gerüstbau GmbH, Berlin.
Statische Seite ohne Build: HTML, CSS, JavaScript. Die Scroll-Animation besteht aus 121 Einzelbildern in `assets/frames`.

## Version 12: Ladebildschirm, AVIF Scroll Bilder, leichtere 3D Modelle (22.11.2026)
- Ladebildschirm auf Startseite und 3D Seite (Inline in `index.html` und `geruestarten.html`, Stil in `style.css` unter „Ladebildschirm“): das Neumann Logo zeichnet sich Linie für Linie mit dem Ladefortschritt, der Schriftzug wischt ein, dann gleitet der Bildschirm nach oben weg. Mindestens 1,2 s, beim zweiten Besuch in der Sitzung 0,45 s, Notausgang nach 10 s. Im Filmmodus (`?film`) aus.
- Startseite: Scroll Sequenz als AVIF (`assets/seq/da` Rechner 1920 px, `assets/seq/ma` Handy 1280 px, gebaut mit `../12_Interaktiv/ladezeit/avif_bauen.sh`), 66 MB auf 20 MB bzw. 32 MB auf 9 MB. Alte WebP bleiben als Rückfall für Browser ohne AVIF. Der Ladebildschirm wartet auf Startbild, Tafeln, Verkehr, Schrift und jedes 4. Bild über die ganze Strecke; danach laden der Rest in Scroll Reihenfolge, 3D Szenen, Filmvorschauen und Referenzbilder im Hintergrund.
- 3D Seite: Modelle mit WebP Texturen und Meshopt (`haus` 5,6 auf 1,8 MB, `strasse_park` 7,1 auf 4,1 MB, `gebaeude` 8,7 auf 3,1 MB, Originale in `../08_Blender/web_assets/glb_original/`). Ladebildschirm wartet auf Himmel, Haus, Straße und Gebäude, Autos und Skyline laden danach und blenden weich ein. Das Gerüst baut sich erst nach dem Ladebildschirm auf.
- Gemessen (lokal, gedrosselt): Startseite frei nach 1,75 s (50 Mbit/s Rechner) bzw. 2,1 s (20 Mbit/s Handy), 3D Seite nach 2,8 s bzw. 5,4 s (vorher 4,2 s bzw. 8,9 s mit Ladebildschirm, ohne ihn baute sich die Szene stückweise auf).

## Version 11: Erklärfilm „Gerüstbau erklärt“ auf der Startseite (22.11.2026)
- Neuer Abschnitt `#erklaert` nach dem Drahtmodell: Erklärfilm 1:43 mit Kapiteln (Aufbau, Gerüstarten, Prüfung), die per Klick an die Stelle springen. Film `assets/film/neumann_erklaerfilm.mp4`, Bild `assets/film/erklaerfilm_poster.jpg`. Spielt einer der beiden Filme, pausiert der andere.
- Der Film ist komplett aus dem 3D Konfigurator gerendert: Filmmodus `geruestarten.html?film` (nur zum Aufnehmen, Steuerung `window.NeumannFilm`), Drehplan und Aufnahme in `../13_Erklaerfilm/werkzeuge/` (`plan.mjs`, `aufnahme.mjs`), Schnitt mit Stimme, Musik und Geräuschen in `../13_Erklaerfilm/video/` (HyperFrames, `python3 bauen.py`).
- Konfigurator: Fußspindel jetzt grün (#10b981), damit sie sich von den anderen Bauteilen abhebt.
- Erklärfilm: Anfang neu gesprochen (deutsche Aussprache statt englischem Akzent), Rest der Stimme unverändert.
- Schneller Start der Startseite: Startbild per `preload` mit hoher Priorität, sofort als Hintergrund der Bühne (unscharfer Platzhalter inline in `style.css`, darüber das volle Bild, deckungsgleich mit dem Canvas). Scroll Bilder und Verkehr laden erst nach dem Startbild, three.js (`scene3d.js`) erst kurz vor dem Drahtmodell, Filmvorschauen (`data-poster`, WebP) erst kurz vor dem Film, Videos mit `preload="none"`. Gemessen (lokal, gedrosselt): Startbild bei 9 Mbit/s nach 0,6 s statt 1,9 s, bei 3 Mbit/s nach 1,0 s statt 3,3 s, Platzhalter schon vorher. Messwerkzeug `../13_Erklaerfilm/werkzeuge/ladezeit.mjs`, Bilder in `../12_Interaktiv/ladezeit/`.

## Version 10: Konfigurator in echter Berliner Straße (22.11.2026)
- Umgebung komplett aus Blender (zwei Blender Agenten, je mit gebackener AO auf der zweiten UV):
  - assets/konfig/strasse_park.glb (7,4 MB): Berliner Gehweg, Bordstein, Fahrbahn mit Markierung, Laternen, Park mit Wegen, Brunnen, Bänken, Hecken, eigene Bäume aus Blattkarten. Skripte 08_Blender/umgebung_strasse/.
  - assets/konfig/gebaeude.glb (9,2 MB): Nachbarhäuser rechts, Zeile gegenüber mit Läden, Stadtblöcke. Skript 08_Blender/umgebung_gebaeude/gebaeude.py.
- Himmel: Poly Haven kloppenheim_06_puresky (CC0), gedreht für Streiflicht von links, als Hintergrund und Umgebungslicht (assets/konfig/himmel.webp).
- Autos: volle Earth 3D Modelle (Glas, Innenraum), Fahrspuren mit Abstand zum Parkstreifen, Fahrtrichtung aus den Rädern bestimmt, am Handy weniger Autos.
- Skyline: Fernsehturm und Alexanderplatz aus Earth 3D am Horizont (assets/konfig/skyline/).
- Kameras über der Fahrbahn, beim Herauszoomen steigt die Kamera über die Dächer.

## Version 9: Konfigurator mit detailliertem Haus und Umgebung (22.11.2026)
- assets/konfig/haus.glb: Gründerzeithaus aus Blender (Blender Agent, Skript 08_Blender/haus_web/haus_web.py), echte 3D Fenster, Tür, Stuck, Mansarde, 5,8 MB, 52.000 Dreiecke, Texturen Poly Haven CC0.
- Umgebung im Browser: Sky (three.js), Streiflicht von links mit Schatten, Gehweg, Straße, Rasen, Hecken, Nachbarhäuser, 20 Bäume aus Blattbüscheln (Instanzen), geparkte und fahrende Autos (Earth 3D Modelle, meshopt).
- Neue Vendor Dateien: assets/vendor/jsm (GLTFLoader, BufferGeometryUtils, Sky, meshopt_decoder) für three r160.

## Version 8: drei interaktive Seiten (22.11.2026)
- geruestarten.html: 3D Konfigurator (three.js, js/konfigurator.js) mit sechs Gerüstarten (Fassade, Roll, Hänge, Raum, Treppenturm, Wetterschutzdach), animiertem Aufbau, Röntgenblick mit Bauteil Legende, Explosionsansicht. Gerüste aus echten Maßen (Feld 2,57 m, Lage 2 m, Rohr 48,3 mm).
- projekt.html: Gerüst Rechner (Richtwerte, Anfrage per Mail vorausgefüllt), Foto Vorschau ohne Server (vier Eckpunkte, perspektivische Abbildung, Foto bleibt im Browser), Baustellen Karte Berlin (Bezirksgrenzen CC BY, js/karte_daten.js, Lage der Projekte ungefähr).
- sicherheit.html: Vorher Nachher Regler (eigene Renderings), Sicherheits Check mit neun Punkten, Zähler, Ablauf, Mitgliedschaften.
- Startseite: neue Menüpunkte Gerüstarten, Ihr Projekt, Sicherheit und drei Kacheln nach der Scroll Sequenz.
- Offen vom Kunden: Preise, echte Firmenzahlen, Adressen der Referenzen, Bestätigung der Lastklassen und Sicherheitstexte.

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
