function generateTempPassword() {
    const words = ["@Pple", "P@nana", "chEri", "d@tE", "elderBerry?"];
    const word1 = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(Math.random() * 9999);
    const word2 = words[Math.floor(Math.random() * words.length)];
    return `${word1}${number}${word2}`;
}

module.exports = generateTempPassword;
