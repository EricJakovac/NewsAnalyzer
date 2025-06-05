#News Analyzer - APVO

___Aplikacija za klasifikaciju vijesti___

Project setup:
1. Kloniraj projekt
2. Udi u frontend folder cd .\frontend\
3. Pokreni naredbu npm install - ovo instalira sve frontend dependencies
4. Onda pokreni naredbu npm run setup - ovo kreira virtual environment i instalira potrebne backend dependencies
5. I nakon sto su svi dependencies isntalirani pokreces backend i frontend skupa s naredbom npm run dev

Dodatno ces mozda morati skinuti Mongo for VSCode extension na Vscodu ako ti se nece uspjesti spojiti s bazom. Trenutno da bi povukla s API-a podatke, istrenirala model te ostalo sve se mora napraviti preko Postmana s slanjem zahtjeva na odredene endpointe, ali to ti sve objasnim kada se cujemo, za sada samo probaj to sve pokrenuti pa cemo dalje skupa nastaviti.

Vjerojatno ces trebati za svaki push/pull i slicno autentificirati se na github sa svojim korisnickim imenom i lozinkom, ali lozinka je zapravo tvoj PAT (token) koji je kod tebe na kompu lokalno pa preporucujem da napravis jos ovo da to ne trebas svaki put upisivati. Obavezno udi na wsl radi ove naredbe pod 9.
1. Udi na ovaj link https://github.com/settings/tokens
2. Kreiraj token, "Generate new token (classic)"
3. Dodan ime koje zelis ja sam stavio "NewsToken" u note
4. Stavi da je "No expiration" te postavi scope na repo i deleterepo
5. Generiraj token i kopiraj ga
6. Pokreni neki naredbu pull ili nesto
7. Upisi svoje korisnicko ime
8. Kopirani token zalijepi u lozinku
9. Kada je sve to zavrsilo baci ovu naredbu git config --global credential.helper store
   ona bi trebala spremiti taj token i korisnicko ime da ne moras svaki put upisivati, trebalo bi raditi na bilo kojem terminalu (cmd, powershell, wsl, git bash,..)
10. Provjeri dal ti se zapravo to spremilo ovom naredbom git config --global credential.helper
    trebalo bi ti izbaciti kao "store" ako su spremljeni svi podaci
11. Dodatno ubaci naredbu cat ~/.git-credentials
    ona provjerava jos koji credentiali su ti spremljeni, trebalo bi izgledati ovako "https://username:personalaccesstoken@github.com"
12. To bi trebalo biti to mozes koristiti sve naredbe bez upisivanja tih tokena i korisnickog imena svaki put

Tech Stack:
- Flask
- React
- MongoDB


___Za Napraviti___

- Na analitics prikazati za svaki article njegovu klasifikaciju
- SearchBar i dodati ElasticSearch u kod, instalirati lokalno 


___NAPRAVLJENO___

Klasifikacija za sve podatke osim general topica, topic imaju polje subcategory za klasifikaciju, a top-headlines imaju polje category

Napravljen pipeline dohvacanje -> ciscenje -> klasifikacija -> spremanje -> dodavanje u elastic -> treniranje modela
