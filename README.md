#News Analyzer - APVO
##Aplikacija za klasifikaciju vijesti 

Project setup:
1. Pokreni WSL
2.  git clone https://github.com/EricJakovac/NewsAnalyzer.git
    cd NewsAnalyzer
3.  python3 -m venv venv
    source venv/bin/activate
4. Provjeri  node -v
             npm -v
   ako ti nisu node i npm instalirani samo baci onu sudo install naredbu    
6. pip install -r requirements.txt
7. Flask ce se pokretati na nacin da ce se prvo istrenirati model te onda pokrenuti backend,
   a frontend  cd frontend
               npm start 
   i to ce ti pokrenuti react u web pregledniku


Tech Stack:
- Flask
- React
- MongoDB
