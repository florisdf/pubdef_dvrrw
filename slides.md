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
colorSchema: 'auto'
---

# Diep Visuele Herkenning
## voor de Echte Wereld

---

# Wie is dit?

- Voor een computer is een afbeelding een grote tabel met getallen

<!--
Tabel Waldek
-->

---

# Een afbeelding als tabel

- Zie een afbeelding als een grote kleurplaat met vierkante vakjes om in te kleuren
- Het kleurenpalet gaat van zwart (0.0) tot wit (1.0)
    - Animatie waarbij kleuren vanuit kleurenpalet op hun plaats vliegen in de afbeelding
    - Ook voor grotere afbeelding tonen

- Bij een kleurenafbeelding zijn er drie tabellen
    - Een tabel met een rood, groen en blauw kleurenpalet
    - Animatie waarbij kleuren vanuit kleurenpalet op hun plaats vliegen in de afbeelding en de kanalen vervolgens over elkaar schuiven om de kleurenafbeelding te vormen

---

# De getallen van twee afbeeldingen vermenigvuldigen en optellen

- We vermenigvuldigen de getallen van twee eenvoudige afbeeldingen met elkaar en tellen de resultaten op.
- Als we dit voor twee *dezelfde* afbeeldingen doen, krijgen we een *groot* getal.
- Als we dit voor twee *verschillende* afbeeldingen doen, krijgen we een *klein* getal.
- We kunnen deze methode van vermenigvuldigen en optellen gebruiken om te weten of er een blauw PacMan spookje op een afbeelding staat. Als het vermenigvuldigen en optellen resulteert in een getal groter dan 50, zeggen we dat de afbeelding een PacMan spookje bevat.

---

# Het artificieel neuron

- Een neuron vermenigvuldigt de getallen van zijn patroon met de getallen van de gegeven afbeelding. Die uitkomsten telt hij op. Als het resultaat van die optelling groter is dan een ingestelde drempelwaarde, activeert het neuron. Anders niet. Als het neuron activeert, is zijn uitgang het getal 1. Als het neuron niet activeert, is zijn uitgang het getal 0.

---

# Neuron gebruiken om patronen in een grote afbeelding te vinden

- De ingang van een neuron moet altijd precies zo groot zijn als het patroon dat hij detecteert
- Kunnen we een neuron ook gebruiken om een patroon te vinden in een grotere afbeelding?
    - Bijvoorbeeld: waar zitten de spookjes in dit PacMan speelveld?
- We kunnen stukje per stukje van de grote afbeelding aan het neuron geven. We kunnen deze tabel met getallen ook terug zien als een afbeelding. Het is een soort van kaart die ons vertelt waar het patroon voorkomt in de grote afbeelding.

---

# Een alledaags neuron

- De neuronen die ik in mijn doctoraat heb gebruikt, detecteren natuurlijk geen PacMan-spookjes
- Een alledaags artificieel neuron detecteert véél eenvoudigere patronen, zoals bv. een streepjespatroon
    - Neuron met streepjespatroon toepassen op echte afbeelding
- Zoals je wel kan vermoeden, zijn we niet zoveel met één neuron. Daarmee weten we enkel waar een bepaald patroon voorkomt in een afbeelding. We kunnen nog andere neuronen gebruiken om andere patronen te vinden. Zo krijgen we verschillende kaarten.

---

# Meerdere lagen van neuronen

- We hebben nu een hoop kaarten die tonen waar bepaalde patronen voorkomen in een afbeelding
- Niets houdt ons tegen om deze kaarten aan nieuwe neuronen te geven. Die maken dan op hun beurt ook allemaal kaarten. Die kaarten kunnen we dan weer aan andere neuronen geven, enzovoort.
- We zeggen dat we meerdere *lagen* van neuronen hebben. Dit noemen we een **diep neuraal netwerk**.

---

# Herkennen wie of wat er op een afbeelding staat

- Hoe dieper we gaan, des te kleiner de kaarten worden die de neuronen maken. Op het einde van het netwerk zijn de kaarten zo klein geworden dat ze nog maar één getal bevatten.
- We kunnen deze getallen zien als een *digitale vingerafdruk* van de afbeelding
- Een afbeelding van dezelfde persoon / hetzelfde voorwerp levert dezelfde vingerafdruk op
- We vergelijken de vingerafdruk van de zoekafbeelding met de vingerafdruk van voorbeeldafbeeldingen waar een naam bij staat. De zoekafbeelding krijgt dan de naam van de voorbeeldafbeelding waarmee die het beste overeenkomt.

---

# Een neuraal netwerk *trainen*

- Een doorsnee neuraal netwerk bevat al gauw duizenden neuronen. Welk patroon laten we elk van deze neuronen detecteren? Het is onbegonnen werk om handmatig op zoek te gaan naar welke patronen we het best gebruiken.
- Gelukkig kunnen we de computer hiernaar laten zoeken.
- We geven de computer vele foto's en zeggen telkens wie of wat er op de foto staat
- Als we vertrekken van willekeurige patronen, zullen de vingerafdrukken van afbeeldingen van dezelfde persoon helemaal niet goed overeenkomen. Door aan de computer mee te geven welke foto's dezelfde vingerafdruk moeten krijgen en welke een verschillende, kan de computer uitzoeken wat goede patronen zijn voor de neuronen. We zeggen dat we het neuraal netwerk *trainen*

---

# Meten hoe goed een neuraal netwerk kan herkennen

- We meten hoe goed het neuraal netwerk kan herkennen door het een digitale vingerafdruk te laten berekenen voor een hoop *foto's* en te controleren hoe goed de vingerafdrukken van dezelfde persoon of hetzelfde voorwerp overeenkomen

- Gegeven een bepaalde zoekafbeelding, sorteer de afbeeldingen van meest to minst gelijkend?
- Als alle afbeeldingen van de juiste persoon vooraan zijn gerangschikt: 100%
- Hoe meer de afbeeldingen van de juiste persoon naar achter gerangschikt zijn, hoe slechter de score
- Helemaal achteraan: 0%
- We doen dit voor een groot aantal zoekafbeeldingen, en berekenen dan de gemiddelde score
- Dit noemen we de *mean Average Precision* (mAP)

---

# Recap

- Een neuraal netwerk bevat vele neuronen die elk een klein patroontje detecteren
- Neuraal netwerk berekent digitale vingerafdruk voor een foto
- Je kan een neuraal netwerk *trainen* door veel voorbeelden te geven van foto's van dezelfde en verschillende voorwerpen
- Nauwkeurigheid van het neuraal netwerk kunnen we meten met de mAP

---

# Drie herkenningstoepassingen

1. Vanden Broele: Foto's selecteren voor een gepersonaliseerd fotoboek
2. Avento: Producten in de rekken van een supermarkt herkennen
3. IGC: Diamanten herkennen

- Hoe goed werkt een neuraal netwerk voor elk van deze toepassingen?
- Kunnen we dit verbeteren door rekening te houden met specifieke eigenschappen van de toepassingen?

---

# Foto's selecteren voor een gepersonaliseerd fotoboek

- Vanden Broele is een drukkerij uit Brugge die doorheen de jaren haar activiteiten heeft verschoven richting digitale producten. In 2016 zagen ze een *booming business* van online diensten voor gepersonaliseerde fotoalbums, zoals Albelli en Vistaprint. Waar bij deze diensten de gebruikers de foto's zelf moesten kiezen, wou Vanden Broele een systeem ontwikkelen dat automatisch een selectie kon maken.
- Meer specifiek had Vanden Broele een product voor ogen dat bestond uit een plakboek en stickervellen met een gepersonaliseerde selectie van foto's.
- De gepersonaliseerde selectie zou dan gekozen worden uit het grote aantal foto's dat na een schooljaar of vakantiekamp gemaakt is door leerkrachten en begeleiders

---

# Algemene aanpak

- Neuraal netwerk getraind met foto's gedownload van het internet kan een digitale vingerafdruk maken voor ieder gezicht in de fotoverzameling
- We vergelijken deze vingerafdrukken met die van voorbeeldfoto's van de kinderen en kunnen zo op ieder gezicht een naam plakken

---

# Probleem met de algemene aanpak

- Sommige kindjes zijn niet geïnteresseerd in een fotoboek, en zullen dus geen voorbeeldfoto geven
- Probleem: deze kunnen verward worden met kinderen die wel voorbeeldfoto's hebben

- Deze kindjes komen typisch echter wel meermaals voor in de verzameling foto's
- Daarom hebben we een methode ontwikkeld om voorbeeldfoto's van onbekende gezichten uit de fotoverzameling te halen
- Methode:
    1. We berekenen een *digitale vingerafdruk* voor ieder gezicht in de fotoverzameling
    2. De digitale vingerafdrukken die op elkaar gelijken groeperen we
    3. Uit de groepen die we nog niet kennen, kiezen we een foto die we als voorbeeldfoto gebruiken voor het onbekende gezicht

---

# Resultaten

- mAP verbetert van 44.6% naar 59.1% als we maar 3 van de 29 kinderen kennen

---

# Producten in de rekken van een supermarkt herkennen

- Avento is een bedrijf dat diensten aanbiedt aan vertegenwoordigers van bedrijven zoals Coca-Cola, Henkel en Duvel Moortgat
- Supermarkten zijn een belangrijke klant voor deze bedrijven. Ze willen dan ook dat hun producten zo goed mogelijk in de kijker staan (*Eye level is buy level!*)
- Avento had een applicatie ontwikkeld waarmee vertegenwoordigers konden berekenen hoeveel ruimte hun producten innamen en konden nagaan of de producten wel op een interessante locatie stonden.
- De vertegenwoordigers moesten hiervoor echter de producten handmatig aanduiden op hun tablet
- Avento zocht een manier om dit handmatig aanduiden te vermijden

---

# Algemene aanpak: eerst lokaliseren, dan herkennen

- We gaan **twee** neurale netwerken gebruiken voor dit probleem
- Het eerste netwerk zoekt de regio's in de afbeelding waar er producten zijn
- Het tweede netwerk berekent een digitale vingerafdruk voor ieder gevonden product

---

# Netwerk trainen voor lokalisatie

- Om een neuraal netwerk te gebruiken voor lokalisatie in plaats van herkenning, moet je nog wat extra toeters en bellen voorzien. Die details gaan we helaas overslaan. Weet dat dit type netwerk geen digitale vingerafdruk moet teruggeven, maar een lijst van locaties waar er producten zijn in de afbeelding.

---

# Netwerk voor herkenning

- Dit type neuraal netwerk kennen we al: het berekent een digitale vingerafdruk
- Dit doen we voor ieder product dat we met het vorige neurale netwerk hebben gevonden

---

# Problemen met de algemene aanpak

- Een foto van een winkelrek moet eerst door het lokalisatie-netwerk, en vervolgens worden alle producten uitgesneden en door het herkenningsnetwerk gehaald
- Voor een foto van 150 producten (toon voorbeeld) kan dit maar liefst 15 seconden duren
- Om dit te versnellen, willen we de twee netwerken versmelten tot één neuraal netwerk
- Dit netwerk geeft meteen de locaties als een digitale vingerafdruk voor ieder product
- Als we beide netwerken bijna volledig versmelten, is de lokalisatie en herkenning veel sneller, maar de mAP wordt ook veel slechter, helaas
- Door de netwerken in mindere mate te versmelten, kunnen we een beter compromis vinden tussen duurtijd en nauwkeurigheid

---

# Diamanten herkennen

- IGC Group is een diamantslijperij uit Antwerpen. Wanneer zij een hoeveelheid diamanten verkopen aan een klant, gebeurt het dat een deel van de diamanten wordt teruggestuurd naar IGC. Uiteraard moet IGC verifiëren dat de teruggestuurde diamanten deel zijn van de diamanten die aanvankelijk werden opgestuurd. IGC wilde een systeem ontwikkelen dat deze verificatie automatisch zou kunnen uitvoeren.

---

# Algemene aanpak

- Neuraal netwerk leren om digitale vingerafdrukken te maken van diamant-foto's
- Vingerafdrukken van teruggestuurde diamanten vergelijken met de vingerafdrukken van opgestuurde diamanten en kijken of deze wel degelijk overeenkomen
- Deze aanpak werkt al heel goed: we behalen 99,97% mAP

---

# Verbetering van de algemene aanpak

- Algemene aanpak werkt al heel goed, maar diamanten zijn zo kostbaar dat iedere mogelijke verbetering grote verliezen van geld kan vermijden
- We houden geen rekening met het feit dat een diamant onder eender welke draairichting kan liggen. Hierdoor kan het dat de digitale vingerafdruk van een diamant verandert als die een andere draairichting heeft. Dat willen we natuurlijk niet...
- Om dit op te lossen stellen we voor om de foto's van de diamanten open te vouwen zodat een *draaiing* van de diamant resulteert in een *verschuiving* in de opengevouwen foto.
- Door het neuraal netwerk met zulke foto's te trainen in plaats van met de oorspronkelijke foto's, stijgt de mAP naar 99,99%.

---

# Openvouwen van diamantenfoto versnellen

- Om de tijd te verkorten die nodig is om een groot aantal diamanten te verwerken, is het belangrijk om het openvouwen van de foto's zo snel mogelijk te doen
- Typisch duurt dit voor 16 foto's zo'n 825 ms
- Door een methode te ontwikkelen die gebruik maakt van de grafische kaart, hebben wij dit kunnen herleiden tot slechts 1.1 ms

---

# Conclusie

- Algemene methodes vormen typisch een goed startpunt, maar kunnen op veel vlakken verbeterd worden door rekening te houden met de specifieke eigenschappen van een toepassing
- Gepersonaliseerde selectie van foto's: mAP stijgt door rekening te houden met onbekende gezichten die meermaals voorkomen in de fotoverzameling
- Herkenning van producten: we kunnen de verwerkingstijd meer dan halveren door het netwerk voor lokalisatie te versmelten met het netwerk voor herkenning, zonder veel in te boeten aan mAP
- Verificatie van diamanten: de mAP verbetert door het netwerk onafhankelijker te maken van de draaiing van de diamant

---

# Bedankt!
