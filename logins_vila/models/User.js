const createUser = async (username, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
    });
    await newUser.save();
  };
  
  // Exemplo de criação de usuário
  createUser('admin', 'password123');
  