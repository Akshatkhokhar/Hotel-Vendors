const fs = require('fs');
const content = fs.readFileSync('app/dashboard/vendor/page.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{') braceCount++;
  if (char === '}') braceCount--;
  if (char === '(') parenCount++;
  if (char === ')') parenCount--;
  if (char === '[') bracketCount++;
  if (char === ']') bracketCount--;
  
  if (braceCount < 0) console.log('Extra } at index ' + i + ' near ' + content.substring(i-20, i+20));
  if (parenCount < 0) console.log('Extra ) at index ' + i + ' near ' + content.substring(i-20, i+20));
  if (bracketCount < 0) console.log('Extra ] at index ' + i + ' near ' + content.substring(i-20, i+20));
}

console.log('Final Counts:');
console.log('Braces: ' + braceCount);
console.log('Parens: ' + parenCount);
console.log('Brackets: ' + bracketCount);
