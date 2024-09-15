const flash = require('connect-flash')
const session = require('express-session');



export default function configureFlash{
  // Configuração da sessão
  app.use(session({
    secret: '123456',
    resave: false,
    saveUninitialized: true,
  }));

  // Configuração do flash
  app.use(flash());
}
