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


Pokretanje projekta
BACKEND
- uci u backend folder cd .\backend\
- Dodati python environment -> python -m venv venv i aktivirati ga -> venv\Scripts\activate (u cmdu na windowsu)
- pokrenuti skidanje requirementsa -> pip install -r requirements.txt
- pokrenuti backend -> python app.py

FRONTEND
- uci u frontend folder -> cd .\frontend\
- pokrenuti instalaciju paketa -> npm install
-pokretanje projekta -> npm start

MONGODB
- spajanje na mongodb pomocu command pallete-a (ctrl+shift+p) MONGODB: Connect with connection string... -> mongodb+srv://<db_username>:<db_password>@cluster0.yi304.mongodb.net/

ELASTICSEARCH
- dodao sam docker-compose.yml file i samo se pokrece u root folderu -> docker-compose up
