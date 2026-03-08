// Question bank for Portuguese 1st cycle curriculum
export interface Question {
  id: string;
  school_year: "1" | "2" | "3" | "4";
  subject: "portugues" | "matematica" | "estudo_meio" | "ingles";
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: number;
}

export const questionBank: Question[] = [
  // ═══════════════════════════════════════════════════
  // 1º ANO - PORTUGUÊS (20 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "p1-1", school_year: "1", subject: "portugues", question_text: "Qual é a primeira letra do alfabeto?", options: ["B", "A", "C", "D"], correct_answer: 1, difficulty: 1 },
  { id: "p1-2", school_year: "1", subject: "portugues", question_text: "Quantas vogais existem?", options: ["3", "4", "5", "6"], correct_answer: 2, difficulty: 1 },
  { id: "p1-3", school_year: "1", subject: "portugues", question_text: "Qual destas palavras começa por 'M'?", options: ["Bola", "Casa", "Mãe", "Pão"], correct_answer: 2, difficulty: 1 },
  { id: "p1-4", school_year: "1", subject: "portugues", question_text: "O que é um nome próprio?", options: ["Nome de animais", "Nome de uma pessoa ou lugar", "Nome de objetos", "Nome de cores"], correct_answer: 1, difficulty: 1 },
  { id: "p1-5", school_year: "1", subject: "portugues", question_text: "Qual a última letra do alfabeto?", options: ["X", "W", "Z", "Y"], correct_answer: 2, difficulty: 1 },
  { id: "p1-6", school_year: "1", subject: "portugues", question_text: "A palavra 'gato' tem quantas sílabas?", options: ["1", "2", "3", "4"], correct_answer: 1, difficulty: 1 },
  { id: "p1-7", school_year: "1", subject: "portugues", question_text: "'Casa' rima com:", options: ["Gato", "Asa", "Bola", "Livro"], correct_answer: 1, difficulty: 1 },
  { id: "p1-8", school_year: "1", subject: "portugues", question_text: "Qual destas é uma vogal?", options: ["B", "C", "E", "D"], correct_answer: 2, difficulty: 1 },
  { id: "p1-9", school_year: "1", subject: "portugues", question_text: "O plural de 'flor' é:", options: ["Flores", "Flors", "Florais", "Flora"], correct_answer: 0, difficulty: 1 },
  { id: "p1-10", school_year: "1", subject: "portugues", question_text: "Qual frase está correta?", options: ["O gato é bonito.", "o gato é bonito", "O Gato é bonito", "o Gato É bonito"], correct_answer: 0, difficulty: 1 },
  { id: "p1-11", school_year: "1", subject: "portugues", question_text: "Qual palavra começa por 'P'?", options: ["Rato", "Sapo", "Pato", "Lobo"], correct_answer: 2, difficulty: 1 },
  { id: "p1-12", school_year: "1", subject: "portugues", question_text: "A palavra 'sol' tem quantas letras?", options: ["2", "3", "4", "5"], correct_answer: 1, difficulty: 1 },
  { id: "p1-13", school_year: "1", subject: "portugues", question_text: "'Pão' rima com:", options: ["Mão", "Pé", "Sol", "Mar"], correct_answer: 0, difficulty: 1 },
  { id: "p1-14", school_year: "1", subject: "portugues", question_text: "Qual destas palavras é um nome de animal?", options: ["Mesa", "Cão", "Lápis", "Porta"], correct_answer: 1, difficulty: 1 },
  { id: "p1-15", school_year: "1", subject: "portugues", question_text: "A letra 'O' é uma:", options: ["Consoante", "Vogal", "Número", "Símbolo"], correct_answer: 1, difficulty: 1 },
  { id: "p1-16", school_year: "1", subject: "portugues", question_text: "Qual é o diminutivo de 'casa'?", options: ["Casão", "Casita", "Casinha", "Casona"], correct_answer: 2, difficulty: 1 },
  { id: "p1-17", school_year: "1", subject: "portugues", question_text: "A frase começa com letra:", options: ["Minúscula", "Maiúscula", "Qualquer uma", "Número"], correct_answer: 1, difficulty: 1 },
  { id: "p1-18", school_year: "1", subject: "portugues", question_text: "Qual palavra tem 3 sílabas?", options: ["Pé", "Sol", "Banana", "Mar"], correct_answer: 2, difficulty: 1 },
  { id: "p1-19", school_year: "1", subject: "portugues", question_text: "O ponto final serve para:", options: ["Fazer perguntas", "Terminar frases", "Gritar", "Nada"], correct_answer: 1, difficulty: 1 },
  { id: "p1-20", school_year: "1", subject: "portugues", question_text: "Qual destas consoantes vem primeiro no alfabeto?", options: ["M", "B", "R", "T"], correct_answer: 1, difficulty: 1 },

  // ═══════════════════════════════════════════════════
  // 1º ANO - MATEMÁTICA (20 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "m1-1", school_year: "1", subject: "matematica", question_text: "Quanto é 2 + 3?", options: ["4", "5", "6", "7"], correct_answer: 1, difficulty: 1 },
  { id: "m1-2", school_year: "1", subject: "matematica", question_text: "Qual número vem depois do 9?", options: ["8", "11", "10", "12"], correct_answer: 2, difficulty: 1 },
  { id: "m1-3", school_year: "1", subject: "matematica", question_text: "Quanto é 5 - 2?", options: ["2", "3", "4", "1"], correct_answer: 1, difficulty: 1 },
  { id: "m1-4", school_year: "1", subject: "matematica", question_text: "Qual é maior: 7 ou 4?", options: ["4", "7", "São iguais", "Nenhum"], correct_answer: 1, difficulty: 1 },
  { id: "m1-5", school_year: "1", subject: "matematica", question_text: "Quantos lados tem um triângulo?", options: ["2", "3", "4", "5"], correct_answer: 1, difficulty: 1 },
  { id: "m1-6", school_year: "1", subject: "matematica", question_text: "Quanto é 1 + 1?", options: ["1", "2", "3", "0"], correct_answer: 1, difficulty: 1 },
  { id: "m1-7", school_year: "1", subject: "matematica", question_text: "Qual é o número par?", options: ["1", "3", "4", "5"], correct_answer: 2, difficulty: 1 },
  { id: "m1-8", school_year: "1", subject: "matematica", question_text: "Quanto é 10 - 5?", options: ["4", "5", "6", "3"], correct_answer: 1, difficulty: 1 },
  { id: "m1-9", school_year: "1", subject: "matematica", question_text: "Quantos lados tem um quadrado?", options: ["3", "4", "5", "6"], correct_answer: 1, difficulty: 1 },
  { id: "m1-10", school_year: "1", subject: "matematica", question_text: "Quanto é 6 + 4?", options: ["9", "10", "11", "8"], correct_answer: 1, difficulty: 1 },
  { id: "m1-11", school_year: "1", subject: "matematica", question_text: "Quanto é 8 - 3?", options: ["4", "5", "6", "7"], correct_answer: 1, difficulty: 1 },
  { id: "m1-12", school_year: "1", subject: "matematica", question_text: "Qual número vem antes do 5?", options: ["3", "4", "6", "7"], correct_answer: 1, difficulty: 1 },
  { id: "m1-13", school_year: "1", subject: "matematica", question_text: "Quanto é 3 + 3?", options: ["5", "6", "7", "8"], correct_answer: 1, difficulty: 1 },
  { id: "m1-14", school_year: "1", subject: "matematica", question_text: "Qual é o número ímpar?", options: ["2", "4", "6", "7"], correct_answer: 3, difficulty: 1 },
  { id: "m1-15", school_year: "1", subject: "matematica", question_text: "Quanto é 9 - 9?", options: ["0", "1", "9", "18"], correct_answer: 0, difficulty: 1 },
  { id: "m1-16", school_year: "1", subject: "matematica", question_text: "Quanto é 7 + 2?", options: ["8", "9", "10", "11"], correct_answer: 1, difficulty: 1 },
  { id: "m1-17", school_year: "1", subject: "matematica", question_text: "Qual número é menor: 3 ou 8?", options: ["3", "8", "São iguais", "Nenhum"], correct_answer: 0, difficulty: 1 },
  { id: "m1-18", school_year: "1", subject: "matematica", question_text: "Quantos dedos temos nas duas mãos?", options: ["5", "8", "10", "12"], correct_answer: 2, difficulty: 1 },
  { id: "m1-19", school_year: "1", subject: "matematica", question_text: "Quanto é 4 + 1?", options: ["3", "4", "5", "6"], correct_answer: 2, difficulty: 1 },
  { id: "m1-20", school_year: "1", subject: "matematica", question_text: "Qual forma tem 0 lados?", options: ["Quadrado", "Triângulo", "Círculo", "Retângulo"], correct_answer: 2, difficulty: 1 },

  // ═══════════════════════════════════════════════════
  // 1º ANO - ESTUDO DO MEIO (15 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "e1-1", school_year: "1", subject: "estudo_meio", question_text: "Qual é a capital de Portugal?", options: ["Porto", "Lisboa", "Coimbra", "Faro"], correct_answer: 1, difficulty: 1 },
  { id: "e1-2", school_year: "1", subject: "estudo_meio", question_text: "Quantas estações do ano existem?", options: ["2", "3", "4", "5"], correct_answer: 2, difficulty: 1 },
  { id: "e1-3", school_year: "1", subject: "estudo_meio", question_text: "Os peixes vivem:", options: ["Na terra", "No ar", "Na água", "Nas árvores"], correct_answer: 2, difficulty: 1 },
  { id: "e1-4", school_year: "1", subject: "estudo_meio", question_text: "Qual o sentido que usamos para ouvir?", options: ["Visão", "Olfato", "Audição", "Tato"], correct_answer: 2, difficulty: 1 },
  { id: "e1-5", school_year: "1", subject: "estudo_meio", question_text: "As plantas precisam de água?", options: ["Sim", "Não", "Às vezes", "Nunca"], correct_answer: 0, difficulty: 1 },
  { id: "e1-6", school_year: "1", subject: "estudo_meio", question_text: "O sol nasce a:", options: ["Norte", "Sul", "Este", "Oeste"], correct_answer: 2, difficulty: 1 },
  { id: "e1-7", school_year: "1", subject: "estudo_meio", question_text: "Quantos meses tem um ano?", options: ["10", "11", "12", "13"], correct_answer: 2, difficulty: 1 },
  { id: "e1-8", school_year: "1", subject: "estudo_meio", question_text: "Qual animal é doméstico?", options: ["Leão", "Gato", "Cobra", "Águia"], correct_answer: 1, difficulty: 1 },
  { id: "e1-9", school_year: "1", subject: "estudo_meio", question_text: "Qual sentido usamos para ver?", options: ["Audição", "Tato", "Visão", "Olfato"], correct_answer: 2, difficulty: 1 },
  { id: "e1-10", school_year: "1", subject: "estudo_meio", question_text: "A chuva vem de:", options: ["Do chão", "Das nuvens", "Do mar", "Das montanhas"], correct_answer: 1, difficulty: 1 },
  { id: "e1-11", school_year: "1", subject: "estudo_meio", question_text: "Qual estação é mais quente?", options: ["Inverno", "Outono", "Primavera", "Verão"], correct_answer: 3, difficulty: 1 },
  { id: "e1-12", school_year: "1", subject: "estudo_meio", question_text: "O coração serve para:", options: ["Respirar", "Pensar", "Bombear sangue", "Digerir"], correct_answer: 2, difficulty: 1 },
  { id: "e1-13", school_year: "1", subject: "estudo_meio", question_text: "As árvores dão-nos:", options: ["Pedras", "Oxigénio", "Plástico", "Metal"], correct_answer: 1, difficulty: 1 },
  { id: "e1-14", school_year: "1", subject: "estudo_meio", question_text: "Quantos dias tem uma semana?", options: ["5", "6", "7", "8"], correct_answer: 2, difficulty: 1 },
  { id: "e1-15", school_year: "1", subject: "estudo_meio", question_text: "De onde vem o leite?", options: ["Da galinha", "Da vaca", "Do porco", "Do peixe"], correct_answer: 1, difficulty: 1 },

  // ═══════════════════════════════════════════════════
  // 2º ANO - PORTUGUÊS (20 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "p2-1", school_year: "2", subject: "portugues", question_text: "Qual é o sinónimo de 'bonito'?", options: ["Feio", "Belo", "Triste", "Grande"], correct_answer: 1, difficulty: 2 },
  { id: "p2-2", school_year: "2", subject: "portugues", question_text: "O antónimo de 'grande' é:", options: ["Enorme", "Alto", "Pequeno", "Largo"], correct_answer: 2, difficulty: 2 },
  { id: "p2-3", school_year: "2", subject: "portugues", question_text: "Qual é o feminino de 'cão'?", options: ["Cãe", "Cadela", "Cãoa", "Canha"], correct_answer: 1, difficulty: 2 },
  { id: "p2-4", school_year: "2", subject: "portugues", question_text: "Na frase 'O João come pão', qual é o verbo?", options: ["João", "come", "pão", "O"], correct_answer: 1, difficulty: 2 },
  { id: "p2-5", school_year: "2", subject: "portugues", question_text: "O que é um adjetivo?", options: ["Uma ação", "Uma qualidade", "Uma pessoa", "Um lugar"], correct_answer: 1, difficulty: 2 },
  { id: "p2-6", school_year: "2", subject: "portugues", question_text: "'Brincar' é um:", options: ["Nome", "Adjetivo", "Verbo", "Pronome"], correct_answer: 2, difficulty: 2 },
  { id: "p2-7", school_year: "2", subject: "portugues", question_text: "O plural de 'animal' é:", options: ["Animals", "Animais", "Animales", "Animalos"], correct_answer: 1, difficulty: 2 },
  { id: "p2-8", school_year: "2", subject: "portugues", question_text: "Qual palavra está escrita corretamente?", options: ["Escula", "Escola", "Escolla", "Escóla"], correct_answer: 1, difficulty: 2 },
  { id: "p2-9", school_year: "2", subject: "portugues", question_text: "'Eu' é um:", options: ["Verbo", "Nome", "Pronome pessoal", "Adjetivo"], correct_answer: 2, difficulty: 2 },
  { id: "p2-10", school_year: "2", subject: "portugues", question_text: "Uma história tem normalmente:", options: ["Introdução, desenvolvimento e conclusão", "Só um parágrafo", "Dois parágrafos", "Nenhuma estrutura"], correct_answer: 0, difficulty: 2 },
  { id: "p2-11", school_year: "2", subject: "portugues", question_text: "O aumentativo de 'casa' é:", options: ["Casita", "Casinha", "Casarão", "Casota"], correct_answer: 2, difficulty: 2 },
  { id: "p2-12", school_year: "2", subject: "portugues", question_text: "Qual é o sinónimo de 'contente'?", options: ["Triste", "Feliz", "Zangado", "Cansado"], correct_answer: 1, difficulty: 2 },
  { id: "p2-13", school_year: "2", subject: "portugues", question_text: "O ponto de interrogação usa-se para:", options: ["Terminar frases", "Fazer perguntas", "Exclamar", "Pausar"], correct_answer: 1, difficulty: 2 },
  { id: "p2-14", school_year: "2", subject: "portugues", question_text: "Na frase 'A Maria é alta', 'alta' é:", options: ["Verbo", "Nome", "Adjetivo", "Pronome"], correct_answer: 2, difficulty: 2 },
  { id: "p2-15", school_year: "2", subject: "portugues", question_text: "O masculino de 'gata' é:", options: ["Gato", "Gate", "Gatão", "Gatis"], correct_answer: 0, difficulty: 2 },
  { id: "p2-16", school_year: "2", subject: "portugues", question_text: "Qual palavra tem 4 sílabas?", options: ["Gato", "Escola", "Borboleta", "Casa"], correct_answer: 2, difficulty: 2 },
  { id: "p2-17", school_year: "2", subject: "portugues", question_text: "O antónimo de 'quente' é:", options: ["Morno", "Frio", "Gelado", "Tépido"], correct_answer: 1, difficulty: 2 },
  { id: "p2-18", school_year: "2", subject: "portugues", question_text: "Qual destas é uma frase exclamativa?", options: ["O gato dorme.", "Onde está o gato?", "Que lindo gato!", "O gato é bonito."], correct_answer: 2, difficulty: 2 },
  { id: "p2-19", school_year: "2", subject: "portugues", question_text: "O plural de 'cão' é:", options: ["Cãos", "Cães", "Cãoes", "Cãs"], correct_answer: 1, difficulty: 2 },
  { id: "p2-20", school_year: "2", subject: "portugues", question_text: "Qual palavra é um nome comum?", options: ["Lisboa", "Maria", "livro", "Portugal"], correct_answer: 2, difficulty: 2 },

  // ═══════════════════════════════════════════════════
  // 2º ANO - MATEMÁTICA (20 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "m2-1", school_year: "2", subject: "matematica", question_text: "Quanto é 15 + 8?", options: ["22", "23", "24", "21"], correct_answer: 1, difficulty: 2 },
  { id: "m2-2", school_year: "2", subject: "matematica", question_text: "Quanto é 3 × 4?", options: ["7", "10", "12", "14"], correct_answer: 2, difficulty: 2 },
  { id: "m2-3", school_year: "2", subject: "matematica", question_text: "Quanto é 20 - 7?", options: ["12", "13", "14", "11"], correct_answer: 1, difficulty: 2 },
  { id: "m2-4", school_year: "2", subject: "matematica", question_text: "Uma dúzia são quantos?", options: ["10", "12", "15", "6"], correct_answer: 1, difficulty: 2 },
  { id: "m2-5", school_year: "2", subject: "matematica", question_text: "Quanto é 2 × 5?", options: ["7", "8", "10", "12"], correct_answer: 2, difficulty: 2 },
  { id: "m2-6", school_year: "2", subject: "matematica", question_text: "Qual é metade de 10?", options: ["3", "4", "5", "6"], correct_answer: 2, difficulty: 2 },
  { id: "m2-7", school_year: "2", subject: "matematica", question_text: "Quanto é 50 + 25?", options: ["70", "75", "80", "65"], correct_answer: 1, difficulty: 2 },
  { id: "m2-8", school_year: "2", subject: "matematica", question_text: "Um retângulo tem quantos lados?", options: ["3", "4", "5", "6"], correct_answer: 1, difficulty: 2 },
  { id: "m2-9", school_year: "2", subject: "matematica", question_text: "Quanto é 100 - 50?", options: ["40", "50", "60", "45"], correct_answer: 1, difficulty: 2 },
  { id: "m2-10", school_year: "2", subject: "matematica", question_text: "Quanto é 6 × 2?", options: ["8", "10", "12", "14"], correct_answer: 2, difficulty: 2 },
  { id: "m2-11", school_year: "2", subject: "matematica", question_text: "Quanto é 4 × 5?", options: ["15", "20", "25", "10"], correct_answer: 1, difficulty: 2 },
  { id: "m2-12", school_year: "2", subject: "matematica", question_text: "Quanto é 30 + 45?", options: ["65", "70", "75", "80"], correct_answer: 2, difficulty: 2 },
  { id: "m2-13", school_year: "2", subject: "matematica", question_text: "Quanto é o dobro de 7?", options: ["12", "13", "14", "15"], correct_answer: 2, difficulty: 2 },
  { id: "m2-14", school_year: "2", subject: "matematica", question_text: "Quanto é 8 × 3?", options: ["21", "22", "24", "26"], correct_answer: 2, difficulty: 2 },
  { id: "m2-15", school_year: "2", subject: "matematica", question_text: "Qual é metade de 20?", options: ["8", "10", "12", "15"], correct_answer: 1, difficulty: 2 },
  { id: "m2-16", school_year: "2", subject: "matematica", question_text: "Quanto é 99 - 33?", options: ["56", "66", "76", "86"], correct_answer: 1, difficulty: 2 },
  { id: "m2-17", school_year: "2", subject: "matematica", question_text: "Quanto é 7 × 7?", options: ["42", "47", "49", "56"], correct_answer: 2, difficulty: 2 },
  { id: "m2-18", school_year: "2", subject: "matematica", question_text: "Quanto é 14 + 16?", options: ["28", "30", "32", "34"], correct_answer: 1, difficulty: 2 },
  { id: "m2-19", school_year: "2", subject: "matematica", question_text: "Quantas horas tem um dia?", options: ["12", "20", "24", "48"], correct_answer: 2, difficulty: 2 },
  { id: "m2-20", school_year: "2", subject: "matematica", question_text: "Quanto é 5 × 5?", options: ["20", "25", "30", "35"], correct_answer: 1, difficulty: 2 },

  // ═══════════════════════════════════════════════════
  // 2º ANO - ESTUDO DO MEIO (15 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "e2-1", school_year: "2", subject: "estudo_meio", question_text: "Qual rio passa em Lisboa?", options: ["Douro", "Mondego", "Tejo", "Guadiana"], correct_answer: 2, difficulty: 2 },
  { id: "e2-2", school_year: "2", subject: "estudo_meio", question_text: "Os mamíferos alimentam as crias com:", options: ["Água", "Leite", "Sumo", "Sementes"], correct_answer: 1, difficulty: 2 },
  { id: "e2-3", school_year: "2", subject: "estudo_meio", question_text: "O que é reciclagem?", options: ["Queimar lixo", "Transformar materiais para reutilizar", "Enterrar lixo", "Não fazer nada"], correct_answer: 1, difficulty: 2 },
  { id: "e2-4", school_year: "2", subject: "estudo_meio", question_text: "As aves têm o corpo coberto de:", options: ["Pelo", "Escamas", "Penas", "Pele"], correct_answer: 2, difficulty: 2 },
  { id: "e2-5", school_year: "2", subject: "estudo_meio", question_text: "Quantos dias tem uma semana?", options: ["5", "6", "7", "8"], correct_answer: 2, difficulty: 2 },
  { id: "e2-6", school_year: "2", subject: "estudo_meio", question_text: "A água pode estar em que estados?", options: ["Sólido, líquido e gasoso", "Só líquido", "Sólido e líquido", "Líquido e gasoso"], correct_answer: 0, difficulty: 2 },
  { id: "e2-7", school_year: "2", subject: "estudo_meio", question_text: "O que é um herbívoro?", options: ["Come carne", "Come plantas", "Come tudo", "Não come"], correct_answer: 1, difficulty: 2 },
  { id: "e2-8", school_year: "2", subject: "estudo_meio", question_text: "Qual é o maior planeta do sistema solar?", options: ["Terra", "Marte", "Júpiter", "Saturno"], correct_answer: 2, difficulty: 2 },
  { id: "e2-9", school_year: "2", subject: "estudo_meio", question_text: "Os répteis têm o corpo coberto de:", options: ["Penas", "Pelo", "Escamas", "Pele lisa"], correct_answer: 2, difficulty: 2 },
  { id: "e2-10", school_year: "2", subject: "estudo_meio", question_text: "Em que estação caem as folhas?", options: ["Primavera", "Verão", "Outono", "Inverno"], correct_answer: 2, difficulty: 2 },
  { id: "e2-11", school_year: "2", subject: "estudo_meio", question_text: "A Lua é um:", options: ["Planeta", "Estrela", "Satélite natural", "Cometa"], correct_answer: 2, difficulty: 2 },
  { id: "e2-12", school_year: "2", subject: "estudo_meio", question_text: "Qual órgão usamos para respirar?", options: ["Coração", "Estômago", "Pulmões", "Fígado"], correct_answer: 2, difficulty: 2 },
  { id: "e2-13", school_year: "2", subject: "estudo_meio", question_text: "O gelo é água no estado:", options: ["Líquido", "Gasoso", "Sólido", "Plasma"], correct_answer: 2, difficulty: 2 },
  { id: "e2-14", school_year: "2", subject: "estudo_meio", question_text: "Qual profissão cuida dos doentes?", options: ["Professor", "Médico", "Bombeiro", "Padeiro"], correct_answer: 1, difficulty: 2 },
  { id: "e2-15", school_year: "2", subject: "estudo_meio", question_text: "O que é um carnívoro?", options: ["Come plantas", "Come carne", "Come fruta", "Come pão"], correct_answer: 1, difficulty: 2 },

  // ═══════════════════════════════════════════════════
  // 3º ANO - PORTUGUÊS (20 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "p3-1", school_year: "3", subject: "portugues", question_text: "O que é um determinante artigo?", options: ["Uma palavra que indica ação", "Uma palavra que acompanha o nome", "Uma palavra que descreve", "Uma palavra que liga frases"], correct_answer: 1, difficulty: 3 },
  { id: "p3-2", school_year: "3", subject: "portugues", question_text: "Qual é o sujeito na frase 'A Maria come fruta'?", options: ["come", "fruta", "A Maria", "A"], correct_answer: 2, difficulty: 3 },
  { id: "p3-3", school_year: "3", subject: "portugues", question_text: "O grau superlativo de 'bom' é:", options: ["Melhor", "Ótimo", "Bão", "Bonissimo"], correct_answer: 1, difficulty: 3 },
  { id: "p3-4", school_year: "3", subject: "portugues", question_text: "Que tipo de texto conta uma história?", options: ["Informativo", "Narrativo", "Poético", "Instrucional"], correct_answer: 1, difficulty: 3 },
  { id: "p3-5", school_year: "3", subject: "portugues", question_text: "Na frase 'Ele corre rápido', 'rápido' é:", options: ["Verbo", "Nome", "Advérbio", "Pronome"], correct_answer: 2, difficulty: 3 },
  { id: "p3-6", school_year: "3", subject: "portugues", question_text: "Qual é o predicado na frase 'O Pedro joga futebol'?", options: ["O Pedro", "joga futebol", "futebol", "joga"], correct_answer: 1, difficulty: 3 },
  { id: "p3-7", school_year: "3", subject: "portugues", question_text: "O que é uma frase imperativa?", options: ["Faz uma pergunta", "Dá uma ordem", "Expressa admiração", "Conta uma história"], correct_answer: 1, difficulty: 3 },
  { id: "p3-8", school_year: "3", subject: "portugues", question_text: "Qual é o plural de 'chapéu'?", options: ["Chapéis", "Chapéus", "Chapéues", "Chapéos"], correct_answer: 1, difficulty: 3 },
  { id: "p3-9", school_year: "3", subject: "portugues", question_text: "'Nós' é um pronome pessoal da:", options: ["1ª pessoa do singular", "2ª pessoa do plural", "1ª pessoa do plural", "3ª pessoa do plural"], correct_answer: 2, difficulty: 3 },
  { id: "p3-10", school_year: "3", subject: "portugues", question_text: "Qual palavra é esdrúxula?", options: ["Café", "Música", "Animal", "Avó"], correct_answer: 1, difficulty: 3 },
  { id: "p3-11", school_year: "3", subject: "portugues", question_text: "Qual é o coletivo de 'lobos'?", options: ["Bando", "Alcateia", "Manada", "Rebanho"], correct_answer: 1, difficulty: 3 },
  { id: "p3-12", school_year: "3", subject: "portugues", question_text: "A vírgula serve para:", options: ["Terminar frases", "Separar elementos", "Fazer perguntas", "Exclamar"], correct_answer: 1, difficulty: 3 },
  { id: "p3-13", school_year: "3", subject: "portugues", question_text: "Qual é o verbo no infinitivo?", options: ["Comi", "Comer", "Come", "Comia"], correct_answer: 1, difficulty: 3 },
  { id: "p3-14", school_year: "3", subject: "portugues", question_text: "Uma palavra aguda tem acento na:", options: ["Primeira sílaba", "Penúltima sílaba", "Última sílaba", "Antepenúltima sílaba"], correct_answer: 2, difficulty: 3 },
  { id: "p3-15", school_year: "3", subject: "portugues", question_text: "Qual é o antónimo de 'rápido'?", options: ["Veloz", "Lento", "Ligeiro", "Ágil"], correct_answer: 1, difficulty: 3 },
  { id: "p3-16", school_year: "3", subject: "portugues", question_text: "O que é uma onomatopeia?", options: ["Uma ação", "Palavra que imita sons", "Um nome", "Uma qualidade"], correct_answer: 1, difficulty: 3 },
  { id: "p3-17", school_year: "3", subject: "portugues", question_text: "'Eles' é a 3ª pessoa do:", options: ["Singular", "Plural", "Infinitivo", "Gerúndio"], correct_answer: 1, difficulty: 3 },
  { id: "p3-18", school_year: "3", subject: "portugues", question_text: "Qual palavra é grave/paroxítona?", options: ["Avó", "Árvore", "Mesa", "Café"], correct_answer: 2, difficulty: 3 },
  { id: "p3-19", school_year: "3", subject: "portugues", question_text: "O que é o grupo nominal?", options: ["O verbo da frase", "O sujeito e os seus determinantes", "O complemento", "O advérbio"], correct_answer: 1, difficulty: 3 },
  { id: "p3-20", school_year: "3", subject: "portugues", question_text: "Qual é a conjugação do verbo 'partir'?", options: ["1ª conjugação", "2ª conjugação", "3ª conjugação", "Irregular"], correct_answer: 2, difficulty: 3 },

  // ═══════════════════════════════════════════════════
  // 3º ANO - MATEMÁTICA (20 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "m3-1", school_year: "3", subject: "matematica", question_text: "Quanto é 125 × 3?", options: ["350", "375", "400", "325"], correct_answer: 1, difficulty: 3 },
  { id: "m3-2", school_year: "3", subject: "matematica", question_text: "Quanto é 1/4 de 100?", options: ["20", "25", "30", "50"], correct_answer: 1, difficulty: 3 },
  { id: "m3-3", school_year: "3", subject: "matematica", question_text: "Quantos centímetros tem 1 metro?", options: ["10", "50", "100", "1000"], correct_answer: 2, difficulty: 3 },
  { id: "m3-4", school_year: "3", subject: "matematica", question_text: "Quanto é 456 - 189?", options: ["267", "277", "257", "247"], correct_answer: 0, difficulty: 3 },
  { id: "m3-5", school_year: "3", subject: "matematica", question_text: "Qual é a terça parte de 15?", options: ["3", "5", "7", "10"], correct_answer: 1, difficulty: 3 },
  { id: "m3-6", school_year: "3", subject: "matematica", question_text: "Quanto é 8 × 9?", options: ["63", "72", "81", "64"], correct_answer: 1, difficulty: 3 },
  { id: "m3-7", school_year: "3", subject: "matematica", question_text: "Quantos milímetros tem 1 centímetro?", options: ["5", "10", "100", "1000"], correct_answer: 1, difficulty: 3 },
  { id: "m3-8", school_year: "3", subject: "matematica", question_text: "Quanto é 1000 - 456?", options: ["534", "544", "554", "564"], correct_answer: 1, difficulty: 3 },
  { id: "m3-9", school_year: "3", subject: "matematica", question_text: "Quanto é 1/2 + 1/2?", options: ["1/4", "2/4", "1", "2"], correct_answer: 2, difficulty: 3 },
  { id: "m3-10", school_year: "3", subject: "matematica", question_text: "Um quilómetro tem quantos metros?", options: ["10", "100", "1000", "10000"], correct_answer: 2, difficulty: 3 },
  { id: "m3-11", school_year: "3", subject: "matematica", question_text: "Quanto é 12 × 12?", options: ["124", "132", "144", "156"], correct_answer: 2, difficulty: 3 },
  { id: "m3-12", school_year: "3", subject: "matematica", question_text: "Quanto é 1/3 de 30?", options: ["5", "10", "15", "20"], correct_answer: 1, difficulty: 3 },
  { id: "m3-13", school_year: "3", subject: "matematica", question_text: "Quantos minutos tem uma hora?", options: ["30", "45", "60", "90"], correct_answer: 2, difficulty: 3 },
  { id: "m3-14", school_year: "3", subject: "matematica", question_text: "Quanto é 250 + 750?", options: ["900", "950", "1000", "1050"], correct_answer: 2, difficulty: 3 },
  { id: "m3-15", school_year: "3", subject: "matematica", question_text: "Qual é o perímetro de um quadrado com lado 5 cm?", options: ["10 cm", "15 cm", "20 cm", "25 cm"], correct_answer: 2, difficulty: 3 },
  { id: "m3-16", school_year: "3", subject: "matematica", question_text: "Quanto é 7 × 8?", options: ["48", "54", "56", "64"], correct_answer: 2, difficulty: 3 },
  { id: "m3-17", school_year: "3", subject: "matematica", question_text: "Quanto é 500 ÷ 5?", options: ["10", "50", "100", "500"], correct_answer: 2, difficulty: 3 },
  { id: "m3-18", school_year: "3", subject: "matematica", question_text: "Quantos gramas tem 1 quilograma?", options: ["10", "100", "1000", "10000"], correct_answer: 2, difficulty: 3 },
  { id: "m3-19", school_year: "3", subject: "matematica", question_text: "Quanto é 2/4 simplificado?", options: ["1/4", "1/2", "2/3", "3/4"], correct_answer: 1, difficulty: 3 },
  { id: "m3-20", school_year: "3", subject: "matematica", question_text: "Quanto é 345 + 678?", options: ["1013", "1023", "1033", "1003"], correct_answer: 1, difficulty: 3 },

  // ═══════════════════════════════════════════════════
  // 3º ANO - ESTUDO DO MEIO (15 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "e3-1", school_year: "3", subject: "estudo_meio", question_text: "Portugal faz fronteira com:", options: ["França", "Espanha", "Itália", "Marrocos"], correct_answer: 1, difficulty: 3 },
  { id: "e3-2", school_year: "3", subject: "estudo_meio", question_text: "Qual é o maior rio de Portugal?", options: ["Mondego", "Douro", "Tejo", "Guadiana"], correct_answer: 2, difficulty: 3 },
  { id: "e3-3", school_year: "3", subject: "estudo_meio", question_text: "O sistema solar tem quantos planetas?", options: ["7", "8", "9", "10"], correct_answer: 1, difficulty: 3 },
  { id: "e3-4", school_year: "3", subject: "estudo_meio", question_text: "Qual é a serra mais alta de Portugal continental?", options: ["Serra da Estrela", "Serra do Gerês", "Serra da Arrábida", "Serra de Sintra"], correct_answer: 0, difficulty: 3 },
  { id: "e3-5", school_year: "3", subject: "estudo_meio", question_text: "Os arquipélagos portugueses são:", options: ["Açores e Canárias", "Madeira e Baleares", "Açores e Madeira", "Canárias e Madeira"], correct_answer: 2, difficulty: 3 },
  { id: "e3-6", school_year: "3", subject: "estudo_meio", question_text: "Qual é o oceano que banha Portugal?", options: ["Pacífico", "Índico", "Atlântico", "Ártico"], correct_answer: 2, difficulty: 3 },
  { id: "e3-7", school_year: "3", subject: "estudo_meio", question_text: "O que é a fotossíntese?", options: ["Respiração dos animais", "Processo das plantas para criar alimento", "Evaporação da água", "Digestão"], correct_answer: 1, difficulty: 3 },
  { id: "e3-8", school_year: "3", subject: "estudo_meio", question_text: "Qual rio passa no Porto?", options: ["Tejo", "Mondego", "Douro", "Guadiana"], correct_answer: 2, difficulty: 3 },
  { id: "e3-9", school_year: "3", subject: "estudo_meio", question_text: "O que são rochas sedimentares?", options: ["Formadas por vulcões", "Formadas por depósitos", "Formadas por pressão", "Formadas pelo vento"], correct_answer: 1, difficulty: 3 },
  { id: "e3-10", school_year: "3", subject: "estudo_meio", question_text: "A Terra demora quanto a dar volta ao Sol?", options: ["1 dia", "1 mês", "1 ano", "1 semana"], correct_answer: 2, difficulty: 3 },
  { id: "e3-11", school_year: "3", subject: "estudo_meio", question_text: "Qual é o ponto cardinal oposto ao Norte?", options: ["Este", "Oeste", "Sul", "Nordeste"], correct_answer: 2, difficulty: 3 },
  { id: "e3-12", school_year: "3", subject: "estudo_meio", question_text: "O que causa as marés?", options: ["O vento", "A chuva", "A Lua", "O Sol"], correct_answer: 2, difficulty: 3 },
  { id: "e3-13", school_year: "3", subject: "estudo_meio", question_text: "Qual destes é um rio português?", options: ["Nilo", "Amazonas", "Mondego", "Sena"], correct_answer: 2, difficulty: 3 },
  { id: "e3-14", school_year: "3", subject: "estudo_meio", question_text: "O que é um vulcão?", options: ["Um rio", "Uma montanha que expele lava", "Um lago", "Uma floresta"], correct_answer: 1, difficulty: 3 },
  { id: "e3-15", school_year: "3", subject: "estudo_meio", question_text: "Qual distrito fica mais a sul de Portugal continental?", options: ["Lisboa", "Setúbal", "Évora", "Faro"], correct_answer: 3, difficulty: 3 },

  // ═══════════════════════════════════════════════════
  // 3º ANO - INGLÊS (15 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "i3-1", school_year: "3", subject: "ingles", question_text: "How do you say 'olá' in English?", options: ["Goodbye", "Hello", "Please", "Thank you"], correct_answer: 1, difficulty: 3 },
  { id: "i3-2", school_year: "3", subject: "ingles", question_text: "What color is the sky?", options: ["Red", "Green", "Blue", "Yellow"], correct_answer: 2, difficulty: 3 },
  { id: "i3-3", school_year: "3", subject: "ingles", question_text: "How many days are in a week?", options: ["Five", "Six", "Seven", "Eight"], correct_answer: 2, difficulty: 3 },
  { id: "i3-4", school_year: "3", subject: "ingles", question_text: "What is 'gato' in English?", options: ["Dog", "Cat", "Bird", "Fish"], correct_answer: 1, difficulty: 3 },
  { id: "i3-5", school_year: "3", subject: "ingles", question_text: "What do you say when someone gives you something?", options: ["Sorry", "Hello", "Thank you", "Goodbye"], correct_answer: 2, difficulty: 3 },
  { id: "i3-6", school_year: "3", subject: "ingles", question_text: "What is 'casa' in English?", options: ["Car", "House", "School", "Book"], correct_answer: 1, difficulty: 3 },
  { id: "i3-7", school_year: "3", subject: "ingles", question_text: "What color is grass?", options: ["Blue", "Red", "Green", "Yellow"], correct_answer: 2, difficulty: 3 },
  { id: "i3-8", school_year: "3", subject: "ingles", question_text: "How do you say 'mãe' in English?", options: ["Father", "Mother", "Sister", "Brother"], correct_answer: 1, difficulty: 3 },
  { id: "i3-9", school_year: "3", subject: "ingles", question_text: "What number is 'ten'?", options: ["5", "8", "10", "12"], correct_answer: 2, difficulty: 3 },
  { id: "i3-10", school_year: "3", subject: "ingles", question_text: "What day comes after Monday?", options: ["Sunday", "Tuesday", "Wednesday", "Friday"], correct_answer: 1, difficulty: 3 },
  { id: "i3-11", school_year: "3", subject: "ingles", question_text: "What is 'água' in English?", options: ["Milk", "Juice", "Water", "Tea"], correct_answer: 2, difficulty: 3 },
  { id: "i3-12", school_year: "3", subject: "ingles", question_text: "How do you say 'grande' in English?", options: ["Small", "Big", "Tall", "Short"], correct_answer: 1, difficulty: 3 },
  { id: "i3-13", school_year: "3", subject: "ingles", question_text: "What is 'livro' in English?", options: ["Pencil", "Book", "Table", "Chair"], correct_answer: 1, difficulty: 3 },
  { id: "i3-14", school_year: "3", subject: "ingles", question_text: "What animal says 'moo'?", options: ["Dog", "Cat", "Cow", "Pig"], correct_answer: 2, difficulty: 3 },
  { id: "i3-15", school_year: "3", subject: "ingles", question_text: "How many months are in a year?", options: ["Ten", "Eleven", "Twelve", "Thirteen"], correct_answer: 2, difficulty: 3 },

  // ═══════════════════════════════════════════════════
  // 4º ANO - PORTUGUÊS (20 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "p4-1", school_year: "4", subject: "portugues", question_text: "O que é uma frase complexa?", options: ["Frase com uma oração", "Frase com duas ou mais orações", "Frase sem verbo", "Frase interrogativa"], correct_answer: 1, difficulty: 4 },
  { id: "p4-2", school_year: "4", subject: "portugues", question_text: "Qual é o complemento direto na frase 'Eu li o livro'?", options: ["Eu", "li", "o livro", "o"], correct_answer: 2, difficulty: 4 },
  { id: "p4-3", school_year: "4", subject: "portugues", question_text: "O que é uma preposição?", options: ["Palavra que liga elementos", "Palavra que descreve", "Palavra que substitui o nome", "Palavra que indica ação"], correct_answer: 0, difficulty: 4 },
  { id: "p4-4", school_year: "4", subject: "portugues", question_text: "Qual destes é um texto argumentativo?", options: ["Uma receita", "Um poema", "Uma carta de opinião", "Uma lenda"], correct_answer: 2, difficulty: 4 },
  { id: "p4-5", school_year: "4", subject: "portugues", question_text: "O pretérito perfeito indica:", options: ["Ação no futuro", "Ação no presente", "Ação no passado já concluída", "Ação habitual"], correct_answer: 2, difficulty: 4 },
  { id: "p4-6", school_year: "4", subject: "portugues", question_text: "Qual é o complemento indireto em 'Dei o livro ao João'?", options: ["o livro", "ao João", "Dei", "Eu"], correct_answer: 1, difficulty: 4 },
  { id: "p4-7", school_year: "4", subject: "portugues", question_text: "O que é uma conjunção?", options: ["Liga frases ou palavras", "Descreve nomes", "Indica ação", "Substitui nomes"], correct_answer: 0, difficulty: 4 },
  { id: "p4-8", school_year: "4", subject: "portugues", question_text: "Qual é o modo indicativo?", options: ["Expressa desejos", "Expressa ordens", "Expressa factos", "Expressa dúvidas"], correct_answer: 2, difficulty: 4 },
  { id: "p4-9", school_year: "4", subject: "portugues", question_text: "'Apesar de' é uma:", options: ["Preposição", "Conjunção", "Locução conjuncional", "Advérbio"], correct_answer: 2, difficulty: 4 },
  { id: "p4-10", school_year: "4", subject: "portugues", question_text: "O que é o discurso direto?", options: ["Narrador conta o que alguém disse", "Personagem fala diretamente", "Descrição de cenário", "Introdução da história"], correct_answer: 1, difficulty: 4 },
  { id: "p4-11", school_year: "4", subject: "portugues", question_text: "Qual é o tempo verbal de 'cantarei'?", options: ["Pretérito", "Presente", "Futuro", "Imperativo"], correct_answer: 2, difficulty: 4 },
  { id: "p4-12", school_year: "4", subject: "portugues", question_text: "O que é uma metáfora?", options: ["Comparação com 'como'", "Comparação sem 'como'", "Repetição de sons", "Exagero"], correct_answer: 1, difficulty: 4 },
  { id: "p4-13", school_year: "4", subject: "portugues", question_text: "Qual é a classe de 'rapidamente'?", options: ["Adjetivo", "Nome", "Advérbio", "Verbo"], correct_answer: 2, difficulty: 4 },
  { id: "p4-14", school_year: "4", subject: "portugues", question_text: "O que é o vocativo?", options: ["Chamar alguém", "Descrever algo", "Contar uma história", "Fazer uma pergunta"], correct_answer: 0, difficulty: 4 },
  { id: "p4-15", school_year: "4", subject: "portugues", question_text: "Qual é o grau comparativo de superioridade de 'bonito'?", options: ["Muito bonito", "Mais bonito do que", "O mais bonito", "Bonitíssimo"], correct_answer: 1, difficulty: 4 },
  { id: "p4-16", school_year: "4", subject: "portugues", question_text: "O pretérito imperfeito indica:", options: ["Ação concluída", "Ação habitual no passado", "Ação futura", "Ordem"], correct_answer: 1, difficulty: 4 },
  { id: "p4-17", school_year: "4", subject: "portugues", question_text: "O que é uma personificação?", options: ["Dar qualidades humanas a coisas", "Exagerar algo", "Comparar com 'como'", "Repetir palavras"], correct_answer: 0, difficulty: 4 },
  { id: "p4-18", school_year: "4", subject: "portugues", question_text: "Qual é o modo conjuntivo?", options: ["Expressa certezas", "Expressa desejos ou dúvidas", "Expressa ordens", "Expressa factos"], correct_answer: 1, difficulty: 4 },
  { id: "p4-19", school_year: "4", subject: "portugues", question_text: "O que é uma frase passiva?", options: ["O sujeito pratica a ação", "O sujeito sofre a ação", "Não tem verbo", "É uma pergunta"], correct_answer: 1, difficulty: 4 },
  { id: "p4-20", school_year: "4", subject: "portugues", question_text: "Qual é o recurso expressivo em 'O sol sorria'?", options: ["Comparação", "Personificação", "Hipérbole", "Onomatopeia"], correct_answer: 1, difficulty: 4 },

  // ═══════════════════════════════════════════════════
  // 4º ANO - MATEMÁTICA (20 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "m4-1", school_year: "4", subject: "matematica", question_text: "Quanto é 3456 ÷ 12?", options: ["278", "288", "298", "308"], correct_answer: 1, difficulty: 4 },
  { id: "m4-2", school_year: "4", subject: "matematica", question_text: "Qual é a área de um retângulo com 5cm × 8cm?", options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"], correct_answer: 2, difficulty: 4 },
  { id: "m4-3", school_year: "4", subject: "matematica", question_text: "Quanto é 0,5 + 0,75?", options: ["1,00", "1,25", "1,50", "0,125"], correct_answer: 1, difficulty: 4 },
  { id: "m4-4", school_year: "4", subject: "matematica", question_text: "Qual fração é equivalente a 1/2?", options: ["2/3", "3/6", "1/4", "2/5"], correct_answer: 1, difficulty: 4 },
  { id: "m4-5", school_year: "4", subject: "matematica", question_text: "Quantos graus tem um ângulo reto?", options: ["45°", "60°", "90°", "180°"], correct_answer: 2, difficulty: 4 },
  { id: "m4-6", school_year: "4", subject: "matematica", question_text: "Quanto é 2,5 × 4?", options: ["8", "10", "12", "6"], correct_answer: 1, difficulty: 4 },
  { id: "m4-7", school_year: "4", subject: "matematica", question_text: "Qual é o volume de um cubo com aresta 3 cm?", options: ["9 cm³", "18 cm³", "27 cm³", "36 cm³"], correct_answer: 2, difficulty: 4 },
  { id: "m4-8", school_year: "4", subject: "matematica", question_text: "Quanto é 3/4 de 80?", options: ["40", "50", "60", "70"], correct_answer: 2, difficulty: 4 },
  { id: "m4-9", school_year: "4", subject: "matematica", question_text: "Qual é 25% de 200?", options: ["25", "40", "50", "75"], correct_answer: 2, difficulty: 4 },
  { id: "m4-10", school_year: "4", subject: "matematica", question_text: "Quanto é 1,2 × 3?", options: ["3,2", "3,6", "4,2", "2,6"], correct_answer: 1, difficulty: 4 },
  { id: "m4-11", school_year: "4", subject: "matematica", question_text: "Quanto é 1000 ÷ 25?", options: ["30", "35", "40", "45"], correct_answer: 2, difficulty: 4 },
  { id: "m4-12", school_year: "4", subject: "matematica", question_text: "Qual ângulo é obtuso?", options: ["45°", "90°", "120°", "30°"], correct_answer: 2, difficulty: 4 },
  { id: "m4-13", school_year: "4", subject: "matematica", question_text: "Quanto é 5/10 em decimal?", options: ["0,05", "0,5", "5,0", "50"], correct_answer: 1, difficulty: 4 },
  { id: "m4-14", school_year: "4", subject: "matematica", question_text: "Qual é o perímetro de um círculo com raio 7 cm? (π≈3,14)", options: ["21,98 cm", "43,96 cm", "14 cm", "49 cm"], correct_answer: 1, difficulty: 4 },
  { id: "m4-15", school_year: "4", subject: "matematica", question_text: "Quanto é 2³?", options: ["6", "8", "9", "12"], correct_answer: 1, difficulty: 4 },
  { id: "m4-16", school_year: "4", subject: "matematica", question_text: "Qual é 10% de 350?", options: ["30", "35", "40", "45"], correct_answer: 1, difficulty: 4 },
  { id: "m4-17", school_year: "4", subject: "matematica", question_text: "Quanto é 4,8 - 2,3?", options: ["2,1", "2,3", "2,5", "2,7"], correct_answer: 2, difficulty: 4 },
  { id: "m4-18", school_year: "4", subject: "matematica", question_text: "Quantos litros tem 1 m³?", options: ["10", "100", "1000", "10000"], correct_answer: 2, difficulty: 4 },
  { id: "m4-19", school_year: "4", subject: "matematica", question_text: "Qual é a média de 4, 6, 8 e 10?", options: ["6", "7", "8", "9"], correct_answer: 1, difficulty: 4 },
  { id: "m4-20", school_year: "4", subject: "matematica", question_text: "Quanto é 15% de 60?", options: ["6", "9", "12", "15"], correct_answer: 1, difficulty: 4 },

  // ═══════════════════════════════════════════════════
  // 4º ANO - ESTUDO DO MEIO (15 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "e4-1", school_year: "4", subject: "estudo_meio", question_text: "Em que ano foi a Revolução dos Cravos?", options: ["1964", "1974", "1984", "1994"], correct_answer: 1, difficulty: 4 },
  { id: "e4-2", school_year: "4", subject: "estudo_meio", question_text: "Quem foi o primeiro rei de Portugal?", options: ["D. Sancho I", "D. Afonso Henriques", "D. Dinis", "D. Manuel I"], correct_answer: 1, difficulty: 4 },
  { id: "e4-3", school_year: "4", subject: "estudo_meio", question_text: "O que são energias renováveis?", options: ["Petróleo e gás", "Solar, eólica e hídrica", "Carvão e nuclear", "Nenhuma das anteriores"], correct_answer: 1, difficulty: 4 },
  { id: "e4-4", school_year: "4", subject: "estudo_meio", question_text: "Qual península está Portugal?", options: ["Itálica", "Balcânica", "Ibérica", "Escandinava"], correct_answer: 2, difficulty: 4 },
  { id: "e4-5", school_year: "4", subject: "estudo_meio", question_text: "Os Descobrimentos Portugueses começaram no século:", options: ["XIII", "XIV", "XV", "XVI"], correct_answer: 2, difficulty: 4 },
  { id: "e4-6", school_year: "4", subject: "estudo_meio", question_text: "O que é a Constituição?", options: ["Uma lei do trânsito", "A lei fundamental do país", "Um livro escolar", "Uma receita"], correct_answer: 1, difficulty: 4 },
  { id: "e4-7", school_year: "4", subject: "estudo_meio", question_text: "Quem descobriu o caminho marítimo para a Índia?", options: ["Cristóvão Colombo", "Vasco da Gama", "Fernão de Magalhães", "Bartolomeu Dias"], correct_answer: 1, difficulty: 4 },
  { id: "e4-8", school_year: "4", subject: "estudo_meio", question_text: "O 25 de Abril celebra:", options: ["O Natal", "A Liberdade", "A República", "A Independência"], correct_answer: 1, difficulty: 4 },
  { id: "e4-9", school_year: "4", subject: "estudo_meio", question_text: "Portugal aderiu à União Europeia em:", options: ["1976", "1986", "1996", "2006"], correct_answer: 1, difficulty: 4 },
  { id: "e4-10", school_year: "4", subject: "estudo_meio", question_text: "O que é o ciclo da água?", options: ["Água parada", "Evaporação, condensação e precipitação", "Só chuva", "Só evaporação"], correct_answer: 1, difficulty: 4 },
  { id: "e4-11", school_year: "4", subject: "estudo_meio", question_text: "Bartolomeu Dias dobrou que cabo?", options: ["Cabo da Roca", "Cabo da Boa Esperança", "Cabo Verde", "Cabo Horn"], correct_answer: 1, difficulty: 4 },
  { id: "e4-12", school_year: "4", subject: "estudo_meio", question_text: "O que é a democracia?", options: ["Governo de um rei", "Governo do povo", "Governo militar", "Sem governo"], correct_answer: 1, difficulty: 4 },
  { id: "e4-13", school_year: "4", subject: "estudo_meio", question_text: "Qual é o feriado nacional de Portugal?", options: ["1 de Dezembro", "10 de Junho", "25 de Abril", "5 de Outubro"], correct_answer: 1, difficulty: 4 },
  { id: "e4-14", school_year: "4", subject: "estudo_meio", question_text: "O que é a erosão?", options: ["Crescimento de plantas", "Desgaste do solo", "Chuva forte", "Terremoto"], correct_answer: 1, difficulty: 4 },
  { id: "e4-15", school_year: "4", subject: "estudo_meio", question_text: "Quando foi implantada a República em Portugal?", options: ["1820", "1910", "1926", "1974"], correct_answer: 1, difficulty: 4 },

  // ═══════════════════════════════════════════════════
  // 4º ANO - INGLÊS (15 perguntas)
  // ═══════════════════════════════════════════════════
  { id: "i4-1", school_year: "4", subject: "ingles", question_text: "What is the past tense of 'go'?", options: ["Goed", "Gone", "Went", "Going"], correct_answer: 2, difficulty: 4 },
  { id: "i4-2", school_year: "4", subject: "ingles", question_text: "How do you say 'eu gosto' in English?", options: ["I want", "I like", "I have", "I need"], correct_answer: 1, difficulty: 4 },
  { id: "i4-3", school_year: "4", subject: "ingles", question_text: "Which is a fruit?", options: ["Carrot", "Potato", "Apple", "Lettuce"], correct_answer: 2, difficulty: 4 },
  { id: "i4-4", school_year: "4", subject: "ingles", question_text: "What month comes after March?", options: ["February", "April", "May", "June"], correct_answer: 1, difficulty: 4 },
  { id: "i4-5", school_year: "4", subject: "ingles", question_text: "Complete: 'She ___ a student.'", options: ["am", "is", "are", "be"], correct_answer: 1, difficulty: 4 },
  { id: "i4-6", school_year: "4", subject: "ingles", question_text: "What is the opposite of 'hot'?", options: ["Warm", "Cold", "Cool", "Wet"], correct_answer: 1, difficulty: 4 },
  { id: "i4-7", school_year: "4", subject: "ingles", question_text: "How do you say 'irmão' in English?", options: ["Sister", "Brother", "Cousin", "Uncle"], correct_answer: 1, difficulty: 4 },
  { id: "i4-8", school_year: "4", subject: "ingles", question_text: "What time is it when the clock shows 3:00?", options: ["Two o'clock", "Three o'clock", "Four o'clock", "Five o'clock"], correct_answer: 1, difficulty: 4 },
  { id: "i4-9", school_year: "4", subject: "ingles", question_text: "Which season comes after winter?", options: ["Summer", "Autumn", "Spring", "Winter"], correct_answer: 2, difficulty: 4 },
  { id: "i4-10", school_year: "4", subject: "ingles", question_text: "Complete: 'They ___ playing football.'", options: ["is", "am", "are", "be"], correct_answer: 2, difficulty: 4 },
  { id: "i4-11", school_year: "4", subject: "ingles", question_text: "What is 'escola' in English?", options: ["House", "Church", "School", "Hospital"], correct_answer: 2, difficulty: 4 },
  { id: "i4-12", school_year: "4", subject: "ingles", question_text: "How many seasons are there?", options: ["Two", "Three", "Four", "Five"], correct_answer: 2, difficulty: 4 },
  { id: "i4-13", school_year: "4", subject: "ingles", question_text: "What is 'vermelho' in English?", options: ["Blue", "Green", "Red", "Yellow"], correct_answer: 2, difficulty: 4 },
  { id: "i4-14", school_year: "4", subject: "ingles", question_text: "Complete: 'I ___ a boy.'", options: ["is", "am", "are", "be"], correct_answer: 1, difficulty: 4 },
  { id: "i4-15", school_year: "4", subject: "ingles", question_text: "What do you wear on your feet?", options: ["Hat", "Gloves", "Shoes", "Scarf"], correct_answer: 2, difficulty: 4 },
];

export const getQuestionsByYear = (year: string) => 
  questionBank.filter(q => q.school_year === year);

export const getQuestionsByYearAndSubject = (year: string, subject: string) =>
  questionBank.filter(q => q.school_year === year && q.subject === subject);

export const getRandomQuestions = (year: string, count: number, subjectWeights?: Record<string, number>) => {
  const yearQuestions = getQuestionsByYear(year);
  
  if (!subjectWeights) {
    const shuffled = [...yearQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  // Weighted selection based on subject priorities
  const weighted: Question[] = [];
  const totalWeight = Object.values(subjectWeights).reduce((a, b) => a + b, 0);
  
  for (const [subject, weight] of Object.entries(subjectWeights)) {
    const subjectQuestions = yearQuestions.filter(q => q.subject === subject);
    const subjectCount = Math.round((weight / totalWeight) * count);
    const shuffled = [...subjectQuestions].sort(() => Math.random() - 0.5);
    weighted.push(...shuffled.slice(0, subjectCount));
  }

  // Fill remaining if needed
  while (weighted.length < count) {
    const remaining = yearQuestions.filter(q => !weighted.includes(q));
    if (remaining.length === 0) break;
    weighted.push(remaining[Math.floor(Math.random() * remaining.length)]);
  }

  return weighted.sort(() => Math.random() - 0.5).slice(0, count);
};
