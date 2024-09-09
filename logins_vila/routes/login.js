const express = require('express');
const router = express.Router();


router.get('/Home', async (req, res) => {
    const mensagemT = req.flash('mensagemTrue');
    const mensagemF = req.flash('mensagemFalse');
    const mensagemN = req.flash('mensagemNotif');
    res.render('Home', {
      mensagemT: mensagemT.length > 0 ? mensagemT[0] : null,
      mensagemF: mensagemF.length > 0 ? mensagemF[0] : null,
      mensagemN: mensagemN.length > 0 ? mensagemN[0] : null,
    });
  });
  
  module.exports = router;