# ⚙️ DarkChirp - API Backend

Ceci est l'API REST de **DarkChirp**, un réseau social de micro-blogging. Le backend gère l'authentification sécurisée, la persistance des données, les interactions sociales (likes, sauvegardes) et l'extraction automatique de hashtags.

---

## 🛠️ Stack Technique

* **Runtime** : Node.js
* **Framework** : Express.js
* **Base de données** : MongoDB avec Mongoose
* **Sécurité** : JSON Web Token (JWT) & Bcrypt
* **Middleware** : Gestion de l'authentification personnalisée

---

## 🚦 Endpoints de l'API

### Authentification (`/users`)
* `POST /users/signup` : Inscription d'un nouvel utilisateur avec hachage du mot de passe (Bcrypt).
* `POST /users/signin` : Connexion et génération d'un Token JWT (expire après 24h).
* `GET /users/me` : (Protégé) Récupère les informations de l'utilisateur connecté via son token.

### Posts (`/posts`)
* `GET /posts/` : Récupère tous les posts, triés du plus récent au plus ancien avec population des auteurs.
* `POST /posts/new` : (Protégé) Publie un nouveau Chirp avec extraction automatique des `#hashtags`.
* `DELETE /posts/:postId` : (Protégé) Supprime un post et nettoie les références (likes/saves) chez les utilisateurs.
* `POST /posts/like/:postId` : (Protégé) Système de Like/Unlike.
* `POST /posts/save/:postId` : (Protégé) Système de sauvegarde (Bookmark) de posts.
* `GET /posts/hashtag/:hashtagName` : Filtre les posts par hashtag.

---

## 🛡️ Sécurité & Middleware
L'API utilise un **Middleware d'Authentification** personnalisé (`auth.js`) qui :
1. Vérifie la présence du header `Authorization: Bearer <token>`.
2. Valide la signature du JWT avec la clé secrète du serveur.
3. Injecte le `userId` dans l'objet `req` pour identifier l'auteur des actions suivantes.

---

## ⚙️ Installation et Lancement

### 1. Prérequis
* **Node.js** installé.
* Une instance **MongoDB** (Cloud Atlas ou locale).

### 2. Installation
```bash
# Cloner le dépôt
git clone [https://github.com/Elian-Al/DarkChirp-backend.git](https://github.com/Elian-Al/DarkChirp-backend.git)

# Accéder au dossier
cd backend

# Installer les dépendances
npm install
```

### 3. Configuration (.env)
Créez un fichier .env à la racine du projet et ajoutez vos variables :

CONNECTION_STRING=votre_lien_mongodb
JWT_SECRET=votre_phrase_secrete

### 4. Lancer le serveur
```bash

# Mode production
npm start

# Mode développement
npm run dev
```

🔗 Liens
Frontend Web : [DarkChirp-frontend-web](https://github.com/Elian-Al/DarkChirp-frontend-web)

📝 Auteur
Elian - [GitHub Profile](https://github.com/Elian-Al)
