const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const multer = require('multer');
const xlsx = require('xlsx');
app.use(express.json())
const mongoose = require('mongoose')
const User = require('./model/user')
const flash = require('connect-flash')
const session = require('express-session');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
app.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());



app.use(flash());
app.use(session({
  secret: '123456',
  resave: false,
  saveUninitialized: true
}));


const MONGO_USER = process.env.MONGO_USER
const MONGO_PASSWORD = process.env.MONGO_PASSWORD


mongoose.connect('mongodb+srv://andersonsous744:anderson1709@cluster0.tcneq.mongodb.net/').then(()=>{
  app.listen(3000)
  console.log('Conexão de usuarios MongoDB autorizada !')
}).catch((err) => console.log(err))




const uploadDir = path.join(__dirname, 'uploads');

// Crie o diretório se ele não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuração do multer para armazenar arquivos temporariamente
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });



require('dotenv').config();

app.set('view engine', 'ejs');
app.use(express.static(__dirname));

// Criação do banco pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Conexão com o banco de dados
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conexão bem-sucedida com o banco de dados!');
  }
});

// Requisições HTTP
app.listen(process.env.APP_PORT, () => {
  console.log("Servidor iniciado com sucesso!");
});



// ROTAS 





app.get("/", authenticateToken, async (req, res) => {
  const mensagemT = req.flash('mensagemTrue');
  const mensagemF = req.flash('mensagemFalse');
  const mensagemN = req.flash('mensagemNotif');
  res.render('Home', {
        mensagemT: mensagemT.length > 0 ? mensagemT[0] : null,
        mensagemF: mensagemF.length > 0 ? mensagemF[0] : null,
        mensagemN: mensagemN.length > 0 ? mensagemN[0] : null,

  } );
});


app.get("/login", async (req, res) => {
  const mensagemT = req.flash('mensagemTrue');
  const mensagemF = req.flash('mensagemFalse');
  const mensagemN = req.flash('mensagemNotif');
  res.render('login', {
      mensagemT: mensagemT.length > 0 ? mensagemT[0] : null,
      mensagemF: mensagemF.length > 0 ? mensagemF[0] : null,
      mensagemN: mensagemN.length > 0 ? mensagemN[0] : null,
   });
});


app.get("/dashboards", async (req, res) => {
  res.render('dashboards');
});


app.get("/resultados", async (req, res) => {
  res.render('resultados');
});


// ROTA DE UPLOAD (TESTE )

app.get('/upload', (req, res) => {
  res.render('upload');
});


app.get('/usuarios', (req, res) => {
  res.render('usuarios');
});





//  principal requisiçao , deve buscar um aluno por nome ou matricula , dependendo do paramentro (param) passado pelo usuario
// ao buscar por nome o usuario é redirecionado para a view rotateste , contendo o nome dos usuarios encontrados pela busca


app.get("/aluno/:param", async (req, res) => {
  try {
      const param = req.params.param;
      let query, values;

      if (/^\d+$/.test(param)) { 
          // Se o parâmetro for composto apenas por dígitos, considere como matrícula
          query = 'SELECT * FROM ALUNO WHERE MATRICULA = $1';
          values = [param];

          const result = await pool.query(query, values);

          if (result.rows.length === 0) {
              return res.status(404).send('Aluno não encontrado.');
          }

          const aluno = result.rows[0];
          res.render('aluno', { aluno });
      } else {
          // Caso contrário, considere como nome (usando ILIKE para case-insensitive match)
          query = 'SELECT * FROM ALUNO WHERE NOME ILIKE $1';
          values = [`%${param}%`];

          const result = await pool.query(query, values);

          if (result.rows.length === 0) {
              return res.status(404).send('Aluno não encontrado.');
          }

          const alunos = result.rows;
          res.render('rotateste', { alunos });
      }
  } catch (error) {
      console.error('Erro ao executar a consulta:', error);
      res.status(500).send('Erro ao executar a consulta.');
  }
});





app.get("/alunos", async (req, res) => {
  try {
    const query = 'SELECT * FROM ALUNO';
    const result = await pool.query(query);
    const alunos = result.rows;
    res.json(alunos);
  } catch (error) {
    console.error('Erro ao obter os dados dos alunos:', error);
    res.status(500).send('Erro ao obter os dados dods alunos.');
  }
});

















app.get("/aluno", async (req, res) => {

  const mensagemT = req.flash('mensagemTrue');
  const mensagemF = req.flash('mensagemFalse');
  const mensagemN = req.flash('mensagemNotif');

  try {
    const searchType = req.query.searchType;
    const param = req.query.param;

    let query, values;

    if (searchType === 'matricula') {
      query = 'SELECT * FROM ALUNO WHERE MATRICULA = $1';
      values = [param];
    } else if (searchType === 'nome') {

      query = 'SELECT NOME, MATRICULA, SERIE FROM ALUNO WHERE NOME ILIKE $1 LIMIT 8';
      values = [`%${param}%`];
    } else {
      return res.status(400).send('Tipo de busca inválido.');
    }

    const result = await pool.query(query, values);



    if (result.rows.length === 0) {
      req.flash('mensagemFalse', "Erro durante a cópia de registros:")
      return res.redirect('back');




    }
    if (searchType === 'matricula') {
      const aluno = result.rows[0];
      res.render('aluno', { aluno });


    } else {
      const alunos = result.rows;
      res.render('resultados', { alunos });

    }
  } catch (error) {
    console.error('Erro ao executar a consulta:', error);
    res.status(500).send('Erro ao executar a consulta.');
  }
});







/* TESTE -- MERODO DE UPLOAD DE PLANILHAS PARA O BANCO DE DADOS ,*/




const validateSheet = (data) => {
  const requiredColumns = ['NOME', 'SERIE', 'UNIDADE', 'EMAIL', 'SENHA_EMAIL', 'MATRICULA', 'SENHA_APP', 'SFB', 'SENHA_SFB', 'RICHMOND', 'SENHA_R', 'ARVORE_SENHA', 'EVOLUCIONAL', 'SENHA_EVO', 'MEDALHEI'];
  const sheetHeaders = Object.keys(data[0] || {});

  // Verificar se todas as colunas obrigatórias estão presentes
  for (const column of requiredColumns) {
    if (!sheetHeaders.includes(column)) {
      throw new Error(`Coluna obrigatória ausente: ${column}`);
    }
  }

  // Verificar cada linha de dados
  data.forEach((row, index) => {
    if (!row['NOME'] || !row['MATRICULA']) {
      throw new Error(`Dados obrigatórios ausentes na linha ${index + 2}`);
    }
  });
};











app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Caminho do arquivo recebido:', req.file.path);

    // Ler o arquivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log('Dados lidos da planilha:', data);

    // Validar a planilha
    validateSheet(data);

    // Processar e salvar os dados


    
    for (const row of data) {
      const { NOME, SERIE, UNIDADE, EMAIL, SENHA_EMAIL, MATRICULA, SENHA_APP, SFB, SENHA_SFB, RICHMOND, SENHA_R, ARVORE_SENHA, EVOLUCIONAL, SENHA_EVO, MEDALHEI } = row;
      if (NOME && MATRICULA) {
        console.log('Inserindo dados:', { NOME, SERIE, UNIDADE, EMAIL, SENHA_EMAIL, MATRICULA, SENHA_APP, SFB, SENHA_SFB, RICHMOND, SENHA_R, ARVORE_SENHA, EVOLUCIONAL, SENHA_EVO, MEDALHEI });
        const query = `
          INSERT INTO ALUNO (NOME, SERIE, UNIDADE, EMAIL, SENHA_EMAIL, MATRICULA, SENHA_APP, SFB, SENHA_SFB, RICHMOND, SENHA_R, ARVORE_SENHA, EVOLUCIONAL, SENHA_EVO, MEDALHEI)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;
        const values = [NOME, SERIE, UNIDADE, EMAIL, SENHA_EMAIL, MATRICULA, SENHA_APP, SFB, SENHA_SFB, RICHMOND, SENHA_R, ARVORE_SENHA, EVOLUCIONAL, SENHA_EVO, MEDALHEI];
        await pool.query(query, values);
      }
    }

    res.status(200).send('Planilha importada com sucesso!');
  } catch (error) {
    console.error('Erro ao importar planilha:', error);
    res.status(500).redirect('back');
  } finally {
    // Remover o arquivo temporário após processamento
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});






// Rota de criação de usuarios

app.post('/register' , async (req,res) => { 
  const  {
    email,
    password,   
  } = req.body

  if(!email){
    return res.status(422).json({msg :"Insira um nome e senha validos"})
  }

  const Userexists = await User.findOne({email:email})


  if(Userexists) { 
    return res.status(422).json({msg :"USUARIO JA CADASTRADO "})
  }


  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)
  const user = new User({
    email,
    password : passwordHash,
  })

  try{
    await user.save()
    res.status(201).json({msg : 'usuario criado com sucesso'})
  }
  catch{
    res.status(500).json({msg: 'erro ao criar o usuario '})

  }
})







// funcao de autenticacao




function authenticateToken(req, res, next) {
  const token = req.cookies.token || req.header('Authorization') && req.header('Authorization').replace('Bearer ', '');

  if (!token) {
      req.flash('mensagemFalse', 'Acesso negado! Por favor, faça login.');
      return res.status(401).redirect('/login');
  }

  
  try {
      const secret = process.env.SECRET_KEY;
      const decoded = jwt.verify(token, secret);
      req.user = decoded; // Adiciona as informações do usuário no req
      next(); // Permite que a requisição prossiga
  } catch (err) {
      req.flash('mensagemFalse', 'Token inválido! Por favor, faça login novamente.');
      return res.status(401).redirect('/login');
  }
}


// rota de autenticacao 


app.post('/login' , async (req,res) => {
    
    const {email,password} = req.body

    const user = await User.findOne({email:email})


  if(!user) { 
    req.flash('mensagemFalse', "Usuário não encontrado!")
    return res.status(404).redirect('back')
  }
  const checkPassword = await bcrypt.compare(password, user.password)

  if (!checkPassword){
    req.flash('mensagemFalse', "Senha incorreta!")
    return res.status(422).redirect('back')
  }

  try {
    const secret = process.env.SECRET_KEY;
    const token = jwt.sign({ id: user._id }, secret);

    // Envia o token como um cookie
    res.cookie('token', token, { httpOnly: true, secure: true, maxAge: 3600000 }); // `httpOnly` impede o acesso via JavaScript

    res.status(200).redirect('/');
    console.log("Usuário logado:", req.body.email);
} catch (err) {
    console.log(err);
    req.flash('mensagemFalse', 'Erro ao fazer login!');
    res.status(500).redirect('/login');
}
    

})




