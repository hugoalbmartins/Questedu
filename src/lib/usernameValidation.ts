const PORTUGUESE_SURNAMES = [
  "Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins",
  "Jesus", "Sousa", "Fernandes", "Gonçalves", "Gomes", "Lopes", "Marques", "Alves",
  "Almeida", "Ribeiro", "Pinto", "Carvalho", "Teixeira", "Moreira", "Correia", "Mendes",
  "Nunes", "Soares", "Vieira", "Monteiro", "Cardoso", "Rocha", "Neves", "Coelho",
  "Cruz", "Cunha", "Pires", "Ramos", "Reis", "Simões", "Antunes", "Matos",
  "Fonseca", "Morais", "Valente", "Cortês", "Nascimento", "Lima", "Araújo", "Barros",
  "Miranda", "Tavares", "Dias", "Henriques", "Guerreiro", "Campos", "Castro", "Machado",
  "Freitas", "Brito", "Garcia", "Azevedo", "Vaz", "Lourenço", "Moura", "Melo"
];

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestion?: string;
}

export function validateUsername(username: string): ValidationResult {
  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 2) {
    return {
      isValid: false,
      reason: "O nome de utilizador deve ter pelo menos 2 caracteres",
    };
  }

  if (trimmedUsername.length > 30) {
    return {
      isValid: false,
      reason: "O nome de utilizador não pode ter mais de 30 caracteres",
    };
  }

  const phoneRegex = /(\+351|00351)?[129]\d{8}|9\d{8}/;
  if (phoneRegex.test(trimmedUsername.replace(/\s/g, ""))) {
    return {
      isValid: false,
      reason: "Por segurança, não uses o teu número de telefone",
      suggestion: "Tenta usar apenas o teu primeiro nome",
    };
  }

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  if (emailRegex.test(trimmedUsername)) {
    return {
      isValid: false,
      reason: "Por segurança, não uses o teu email",
      suggestion: "Tenta usar apenas o teu primeiro nome",
    };
  }

  const addressKeywords = [
    "rua", "avenida", "praceta", "travessa", "largo", "praça",
    "calçada", "estrada", "alameda", "beco", "viela", "quinta"
  ];
  const lowerUsername = trimmedUsername.toLowerCase();
  const hasAddressKeyword = addressKeywords.some(keyword => lowerUsername.includes(keyword));
  const hasNumber = /\d/.test(trimmedUsername);

  if (hasAddressKeyword && hasNumber) {
    return {
      isValid: false,
      reason: "Por segurança, não partilhes a tua morada",
      suggestion: "Usa um nome simples e criativo",
    };
  }

  const words = trimmedUsername.split(/\s+/);
  if (words.length >= 3) {
    const hasSurname = words.some(word =>
      PORTUGUESE_SURNAMES.some(surname =>
        surname.toLowerCase() === word.toLowerCase()
      )
    );

    if (hasSurname) {
      const firstName = words[0];
      return {
        isValid: false,
        reason: "Evita usar o teu nome completo por segurança",
        suggestion: `Que tal usar apenas "${firstName}"?`,
      };
    }
  }

  if (words.length === 2) {
    const [first, second] = words;
    const secondIsSurname = PORTUGUESE_SURNAMES.some(surname =>
      surname.toLowerCase() === second.toLowerCase()
    );

    if (secondIsSurname && first.length > 2) {
      return {
        isValid: false,
        reason: "Recomendamos usar apenas o primeiro nome",
        suggestion: `Que tal "${first}"?`,
      };
    }
  }

  const profanityPatterns = [
    /\b(merda|caralho|porra|foda|cu|cona|picha|puta|fdp)\b/i,
    /\b(fuck|shit|ass|bitch|damn|hell)\b/i,
  ];

  for (const pattern of profanityPatterns) {
    if (pattern.test(trimmedUsername)) {
      return {
        isValid: false,
        reason: "Usa um nome apropriado e respeitador",
      };
    }
  }

  const nonAlphaCount = (trimmedUsername.match(/[^a-zA-ZÀ-ÿ\s]/g) || []).length;
  if (nonAlphaCount > 3) {
    return {
      isValid: false,
      reason: "Usa principalmente letras no teu nome",
      suggestion: "Remove alguns caracteres especiais",
    };
  }

  return {
    isValid: true,
  };
}

export function sanitizeUsername(username: string): string {
  return username
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 30);
}

export function suggestAlternativeUsername(username: string): string {
  const words = username.split(/\s+/);
  if (words.length > 1) {
    return words[0];
  }

  const withoutNumbers = username.replace(/\d+/g, "");
  if (withoutNumbers && withoutNumbers !== username) {
    return withoutNumbers;
  }

  const specialCharsRemoved = username.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
  if (specialCharsRemoved && specialCharsRemoved !== username) {
    return specialCharsRemoved;
  }

  return username;
}
