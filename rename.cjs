const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'README.md',
  'app_analysis_report.md',
  'package.json',
  'server/package.json',
  'docker-compose.yml',
  'server/docker-compose.yml',
  'index.html',
  'src/components/Navbar.jsx',
  'src/components/Sidebar.jsx',
  'backend/ml-service/app/main.py',
  'server/src/index.js',
  'server/src/socket/index.js',
  'scripts/generateData.cjs'
];

for (const file of filesToUpdate) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file} - not found`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Custom logic per file or global safe logic
  if (file === 'package.json' || file === 'server/package.json') {
    content = content.replace(/"name": "geoguardian"/, '"name": "hazardmap"');
    content = content.replace(/"name": "geoguardian-server"/, '"name": "hazardmap-server"');
    content = content.replace(/GeoGuardian/g, 'HazardMap');
  } 
  else if (file === 'docker-compose.yml' || file === 'server/docker-compose.yml') {
    // We must NOT change POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, and DATABASE_URL
    // But we CAN change container_name: geoguardian-db to hazardmap-db etc.
    content = content.replace(/container_name: geoguardian-/g, 'container_name: hazardmap-');
    content = content.replace(/GeoGuardian/g, 'HazardMap');
    content = content.replace(/geoguardianreal-time-ml-service/g, 'hazardmap-ml-service');
  }
  else {
    // Global replace for branding
    content = content.replace(/GeoGuardian/g, 'HazardMap');
    content = content.replace(/geoguardian/g, 'hazardmap');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
