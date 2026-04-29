
const fs = require('fs');
const content = fs.readFileSync('c:\\Amalgamate\\Projects\\Zawadi SMS\\src\\components\\CBCGrading\\pages\\FeeCollectionPage.jsx', 'utf8');

function count(str, char) {
    return str.split(char).length - 1;
}

console.log('Open braces {:', count(content, '{'));
console.log('Close braces }:', count(content, '}'));
console.log('Open parens (:', count(content, '('));
console.log('Close parens ):', count(content, ')'));
console.log('Open divs <div:', count(content, '<div'));
console.log('Close divs </div:', count(content, '</div'));
