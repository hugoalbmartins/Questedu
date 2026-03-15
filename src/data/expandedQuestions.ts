export interface ExpandedQuestion {
  school_year: '1' | '2' | '3' | '4';
  subject: 'portugues' | 'matematica' | 'estudo_meio' | 'ingles';
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: number;
  school_period: 'inicio_ano' | 'meio_ano' | 'fim_ano' | 'revisao';
  topic: string;
}

export const portugues1ano: ExpandedQuestion[] = [
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'Qual é a vogal que vem depois do "A"?',
    options: ['B', 'E', 'C', 'D'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'alfabeto'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'Quantas vogais existem no alfabeto português?',
    options: ['3', '5', '7', '10'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'alfabeto'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'A palavra "casa" começa com que letra?',
    options: ['K', 'S', 'C', 'Z'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'ortografia'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'Qual palavra está escrita corretamente?',
    options: ['kaza', 'caza', 'casa', 'kasa'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'ortografia'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'Quantas letras tem a palavra "bola"?',
    options: ['2', '3', '4', '5'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'ortografia'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'Qual palavra rima com "gato"?',
    options: ['cão', 'pato', 'casa', 'bola'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'rima'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'A frase "O cão late." fala sobre:',
    options: ['um gato', 'um cão', 'um pássaro', 'uma casa'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'compreensao'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'Qual é o plural de "bola"?',
    options: ['bola', 'bolas', 'bolaes', 'bolões'],
    correct_answer: 1,
    difficulty: 2,
    school_period: 'meio_ano',
    topic: 'gramatica'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'Qual palavra tem 2 sílabas?',
    options: ['ca-sa', 'á-gua', 'a', 'ba-na-na'],
    correct_answer: 0,
    difficulty: 2,
    school_period: 'fim_ano',
    topic: 'silabas'
  },
  {
    school_year: '1',
    subject: 'portugues',
    question_text: 'Complete: "A menina ___ bonita."',
    options: ['são', 'é', 'estar', 'foram'],
    correct_answer: 1,
    difficulty: 2,
    school_period: 'fim_ano',
    topic: 'verbos'
  }
];

export const matematica1ano: ExpandedQuestion[] = [
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Quanto é 1 + 1?',
    options: ['1', '2', '3', '4'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'adicao'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Quantas maçãs estão na imagem? 🍎🍎🍎',
    options: ['2', '3', '4', '5'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'contagem'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Qual número vem depois do 5?',
    options: ['4', '6', '7', '8'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'sequencias'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Quanto é 2 + 2?',
    options: ['2', '3', '4', '5'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'adicao'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Quanto é 5 - 2?',
    options: ['2', '3', '4', '7'],
    correct_answer: 1,
    difficulty: 2,
    school_period: 'meio_ano',
    topic: 'subtracao'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Quantos dedos tens numa mão?',
    options: ['4', '5', '6', '10'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'contagem'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Quanto é 3 + 4?',
    options: ['5', '6', '7', '8'],
    correct_answer: 2,
    difficulty: 2,
    school_period: 'meio_ano',
    topic: 'adicao'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Qual número é maior: 8 ou 5?',
    options: ['5', '8', 'são iguais', 'nenhum'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'comparacao'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Quanto é 10 - 3?',
    options: ['6', '7', '8', '13'],
    correct_answer: 1,
    difficulty: 2,
    school_period: 'fim_ano',
    topic: 'subtracao'
  },
  {
    school_year: '1',
    subject: 'matematica',
    question_text: 'Quantas patas tem um cão? 🐕',
    options: ['2', '3', '4', '6'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'contagem'
  }
];

export const estudoMeio1ano: ExpandedQuestion[] = [
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'Qual é a capital de Portugal?',
    options: ['Porto', 'Lisboa', 'Coimbra', 'Faro'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'geografia'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'Quantas estações do ano existem?',
    options: ['2', '3', '4', '5'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'natureza'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'Qual animal vive no mar?',
    options: ['cão', 'gato', 'peixe', 'pássaro'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'animais'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'Em que estação do ano caem as folhas das árvores?',
    options: ['Primavera', 'Verão', 'Outono', 'Inverno'],
    correct_answer: 2,
    difficulty: 2,
    school_period: 'meio_ano',
    topic: 'natureza'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'O Sol nasce:',
    options: ['ao meio-dia', 'de manhã', 'à tarde', 'à noite'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'astronomia'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'Quantos dias tem uma semana?',
    options: ['5', '6', '7', '8'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'tempo'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'Qual sentido usamos para ver?',
    options: ['audição', 'visão', 'olfato', 'paladar'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'corpo_humano'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'As plantas precisam de ___ para crescer:',
    options: ['chocolate', 'água e sol', 'televisão', 'sapatos'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'plantas'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'Qual é o maior oceano perto de Portugal?',
    options: ['Oceano Pacífico', 'Oceano Atlântico', 'Mar Mediterrâneo', 'Oceano Índico'],
    correct_answer: 1,
    difficulty: 2,
    school_period: 'fim_ano',
    topic: 'geografia'
  },
  {
    school_year: '1',
    subject: 'estudo_meio',
    question_text: 'No Inverno, o tempo está geralmente:',
    options: ['quente', 'frio', 'seco', 'colorido'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'clima'
  }
];

export const ingles1ano: ExpandedQuestion[] = [
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'Como se diz "olá" em inglês?',
    options: ['Bye', 'Hello', 'Thanks', 'Sorry'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'saudacoes'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'Qual é a cor "red" em português?',
    options: ['azul', 'verde', 'vermelho', 'amarelo'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'cores'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'Como se diz "gato" em inglês?',
    options: ['dog', 'cat', 'bird', 'fish'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'animais'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'Qual número é "three"?',
    options: ['1', '2', '3', '4'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'numeros'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'Como se diz "obrigado" em inglês?',
    options: ['Sorry', 'Please', 'Thank you', 'Hello'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'saudacoes'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'A cor "blue" é:',
    options: ['vermelho', 'azul', 'verde', 'amarelo'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'cores'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'Como se diz "cão" em inglês?',
    options: ['cat', 'dog', 'bird', 'fish'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'inicio_ano',
    topic: 'animais'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'Qual número é "five"?',
    options: ['3', '4', '5', '6'],
    correct_answer: 2,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'numeros'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'Como se diz "adeus" em inglês?',
    options: ['Hello', 'Goodbye', 'Thanks', 'Sorry'],
    correct_answer: 1,
    difficulty: 1,
    school_period: 'meio_ano',
    topic: 'saudacoes'
  },
  {
    school_year: '1',
    subject: 'ingles',
    question_text: 'A palavra "apple" significa:',
    options: ['banana', 'maçã', 'laranja', 'pera'],
    correct_answer: 1,
    difficulty: 2,
    school_period: 'fim_ano',
    topic: 'comida'
  }
];

export const allExpandedQuestions1Ano = [
  ...portugues1ano,
  ...matematica1ano,
  ...estudoMeio1ano,
  ...ingles1ano
];
