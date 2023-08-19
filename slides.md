---
theme: seriph
background: https://source.unsplash.com/collection/94734566/1920x1080
class: text-center
highlighter: shiki
lineNumbers: false
info: |
  ## Diep Visuele Herkenning voor de Echte Wereld

  Slides voor publieke verdediging.
drawings:
  persist: false
transition: slide-left
title: Diep Visuele Herkenning voor de Echte Wereld
---

# Diep Visuele Herkenning
## voor de Echte Wereld

---

# Visuele Herkenning

- Een computer gebruiken om automatisch te weten te komen wat er in een foto is afgebeeld

<!--
Wat bedoelen we met *Visuele Herkenning*?
-->

---

# Diep Visuele Herkenning

- We maken gebruik van **diepe neurale netwerken**

<!--
Wat bedoelen we met *Diep Visuele Herkenning*?
-->

---

# Diep Visuele Herkenning voor de Echte Wereld

- Bestaande technieken zijn gericht op brede toepasbaarheid
- Technieken verbeteren door rekening te houden met de **specifieke eigenschappen** van een toepassing
- We behandelen **drie toepassingen**:
    1. Foto's selecteren voor een persoonlijk fotoboek
    2. Producten in de rekken van een supermarkt herkennen
    3. Diamanten herkennen
- Voor elk van deze toepassingen testen we eerst een bestaande techniek uit
- Vervolgens proberen we de resultaten te verbeteren door rekening te houden met specifieke eigenschappen van de toepassing

<!--
Wat bedoelen we met *Diep Visuele Herkenning voor de Echte Wereld*?
-->

---

# Hoe een computer een afbeelding ziet

- Voor een computer is een afbeelding een grote tabel met getallen
- Voor kleurafbeeldingen: drie grote tabellen

---

# Hoe kan een computer weten wat er op een afbeelding staat?

- De computer voert een reeks berekeningen uit met deze tabel getallen die resulteren in een relatief korte lijst van getallen. Deze lijst kan je zien als een soort van *barcode*.
- De berekeningen moeten zo gebeuren dat een afbeelding van dezelfde persoon / hetzelfde voorwerp ook dezelfde barcode oplevert
- De computer vergelijkt de barcode van de zoekafbeelding met de barcodes van voorbeeldafbeeldingen

---

# Hoe kan een computer zulke *barcodes* berekenen?

- We gaan de afbeelding vele keren *filteren*
- Elke filter accentueert bepaalde eigenschappen van de afbeelding: bv. waar er zich horizontale en verticale randen bevinden
- De gefilterde versies van de afbeelding worden *opnieuw* gefilterd, deze keer door meer filters
- Dit doen we nog enkele keren, telkens met andere filters en telkens met meer filters
- De laatste filters geven uiteindelijk de barcode van de afbeelding

<!--
Bij *filteren* een grappige Snapchat-filter toepassen op afbeelding die in het groot getoond staat.
-->

---

# Welke filters gebruiken we?

- Voor het herkennen van gezichten hebben we andere filters nodig dan voor het herkennen van supermarktproducten
- We geven de computer vele foto's en zeggen telkens wie of wat er op de foto staat
- De computer kan dan *zelf leren* wat goede filters zijn

---


