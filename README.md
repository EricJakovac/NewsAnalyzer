#News Analyzer - APVO

___Aplikacija za klasifikaciju vijesti___

Projekt News Analyzer je web-aplikacija za automatsku analizu i kategorizaciju novinskih članaka u stvarnom vremenu. Sastoji se od tri glavne cjeline:

    Backend je razvijen u Python Flasku i zadužen je za dohvat vijesti s vanjskih izvora (News API), obradu i čišćenje podataka, automatsku kategorizaciju članaka korištenjem strojnog učenja (Naive Bayes), te izlaganje REST API-ja za frontend.

    Data sloj koristi MongoDB kao primarnu bazu za pohranu strukturiranih članaka i ElasticSearch za brzo pretraživanje i naprednu analitiku. Modeli strojnog učenja pohranjeni su kao joblib datoteke.

    Frontend je izrađen u React.js i omogućuje korisnicima pregled, pretraživanje, filtriranje i vizualizaciju vijesti po kategorijama i podkategorijama, kao i interaktivni prikaz statistika i detalja svakog članka.

Svrha projekta je omogućiti korisnicima brz i pregledan uvid u aktualne vijesti, automatski ih razvrstati po temama i podtemama, te pružiti napredne analitičke alate za istraživanje trendova i strukture novinskog sadržaja. Sustav je skalabilan, radi u stvarnom vremenu i integrira moderne tehnologije za rad s velikim količinama podataka i strojno učenje.

Tech Stack:
- Flask
- React
- MongoDB