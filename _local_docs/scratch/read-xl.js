const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve('C:\\Amalgamate\\Projects\\Zawadi SMS\\data\\xlsx.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  console.log(`Loaded Workbook. Sheets: ${workbook.SheetNames.join(', ')}`);

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  console.log(`\nFound ${data.length} rows in sheet "${firstSheetName}".`);
  
  if (data.length > 0) {
    console.log('\nColumns detected:');
    console.log(Object.keys(data[0]).join(' | '));
    
    console.log('\nFirst 5 rows:');
    for(let i = 0; i < Math.min(5, data.length); i++) {
        console.log(JSON.stringify(data[i], null, 2));
    }
    
    // Sample a random row from middle
    if(data.length > 10) {
        console.log('\nMiddle row sample:');
        console.log(JSON.stringify(data[Math.floor(data.length/2)], null, 2));
    }
  } else {
    console.log('Sheet is empty.');
  }

} catch (error) {
  console.error('Error reading the excel file:', error.message);
}
