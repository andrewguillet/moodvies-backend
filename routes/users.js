var express = require("express");
var router = express.Router();

require("../models/connection");
const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

// Fonction Regex pour valider le format de l'email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Route POST pour l'inscription des utilisateurs
router.post("/signup", async (req, res) => {
  console.log(req.body); // Ajouter cette ligne pour loguer le corps de la requête
  // Vérifie si les champs requis sont présents et non vides dans le corps de la requête
  if (!checkBody(req.body, ["username", "email", "password", "birthday"])) {
    return res.json({ result: false, error: "Missing or empty fields" }); // Renvoie une réponse JSON avec une erreur si des champs sont manquants ou vides
  }
  // Valide le format de l'email
  if (!validateEmail(req.body.email)) {
    return res.json({ result: false, error: "Invalid email format" });
  }

  try {
    // Vérifie si un utilisateur avec le même nom d'utilisateur ou email existe déjà, insensible à la casse pour le nom d'utilisateur
    const existingUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(req.body.username, "i") } },
        { email: req.body.email },
      ],
    });

    if (existingUser) {
      return res.json({ result: false, error: "User already exists" }); // Renvoie une réponse JSON avec une erreur si l'utilisateur existe déjà
    }

    // Hash le mot de passe avec bcrypt en utilisant un sel de 10
    const hash = bcrypt.hashSync(req.body.password, 10);

    console.log(new Date(req.body.birthday))

    // Crée un nouvel utilisateur avec les informations fournies
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      birthday: new Date(req.body.birthday),
      genre: req.body.genre,
      password: hash,
      token: uid2(32), // Génère un token unique
    });

    // Sauvegarde le nouvel utilisateur dans la base de données
    const savedUser = await newUser.save();

    // Renvoie une réponse JSON avec le token de l'utilisateur en cas de succès
    res.json({ result: true, token: savedUser.token });
  } catch (error) {
    console.error("Signup error:", error);
    // Renvoie une réponse JSON avec une erreur en cas d'échec de la sauvegarde ou de la recherche
    res.json({ result: false, error: "An error occurred during signup" });
  }
});

module.exports = router;


