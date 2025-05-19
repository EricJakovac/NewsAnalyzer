#News Analyzer - APVO

##Aplikacija za klasifikaciju vijesti 

Project setup:
1. Pokreni WSL
2.  Koristi naredbe git clone https://github.com/EricJakovac/NewsAnalyzer.git
    cd NewsAnalyzer
3.  Nakon toga ubaci ove dvije naredbe python3 -m venv venv
    source venv/bin/activate
4. Provjeri  node -v
             npm -v
   ako ti nisu node i npm instalirani samo baci onu sudo install naredbu    
6. pip install -r requirements.txt
7. Flask ce se pokretati na nacin da ce se prvo istrenirati model te onda pokrenuti backend,
   a frontend  cd frontend
               npm start 
   i to ce ti pokrenuti react u web pregledniku

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
