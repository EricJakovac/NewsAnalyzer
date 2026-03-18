# [News Analyzer - Napredni sustav za klasifikaciju i analizu vijesti](https://news-analyzer-pi.vercel.app/)

News Analyzer je robustna full-stack platforma dizajnirana za agregaciju, obradu i inteligentnu analizu novinskih članaka u stvarnom vremenu. Sustav automatizira proces kategorizacije vijesti koristeći strojno učenje, dok korisnicima pruža napredne mogućnosti pretraživanja i personalizirane preporuke.

## 🚀 Glavne Funkcionalnosti
- **Automatska Kategorizacija:** Sustav prepoznaje teme i podteme članaka u trenutku ulaza u bazu podataka.
- **Napredna Tražilica:** Integracija s Elasticsearchom omogućuje trenutačno pretraživanje kroz tisuće članaka uz podršku za fuzzy search i filtriranje.
- **Interaktivna Analitika:** Custom dashboard izgrađen u Reactu koji vizualizira korisničke putanje (Path Analysis), stope zadržavanja (Retention) i popularnost kategorija.
- **Sustav Preporuka:** Algoritam koji analizira interese korisnika i sugerira relevantne vijesti.
- **AI Chatbot:** Pametni asistent za brzu navigaciju i odgovore na upite o trenutnim vijestima.
- **Kontejnerizacija:** Cijeli sustav (Frontend, Backend, DB, Search Engine) je orkestriran pomoću Dockera, što osigurava identično okruženje za razvoj i produkciju.

## 🛠 Tehnički Stack
- **Frontend:** React.js, Recharts (za vizualizaciju podataka), Lucide-react (ikone), Tailwind/CSS3.
- **Backend:** Flask (Python) – RESTful API dizajn.
- **Baze podataka:** MongoDB: Primarno spremište za nestrukturirane podatke o vijestima.
- **Elasticsearch:** Specijalizirani engine za brzo indeksiranje i pretraživanje teksta.
- **Analitika:** Google Analytics (GA) integracija + Custom server-side analitika.
- **DevOps:** Docker, Docker-Compose.

## 🏗 Arhitektura sustava

Sustav prati mikroservisnu logiku gdje Flask backend služi kao "most" između React frontenda i višestrukih izvora podataka (Mongo + Elasticsearch), osiguravajući visoku dostupnost i brzinu odziva.
