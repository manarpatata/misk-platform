import fs from 'fs';

function replaceAlerts(filePath: string) {
  let code = fs.readFileSync(filePath, 'utf8');
  let originalCode = code;

  // Ensure toast is imported
  if (!code.includes("import { toast }")) {
    const depth = filePath.split('/').length - 2; 
    let importPath = "'./lib/toast'";
    if (depth === 1) importPath = "'../lib/toast'";
    if (depth === 2) importPath = "'../../lib/toast'";
    if (depth === 3) importPath = "'../../../lib/toast'";
    
    code = code.replace(/import React[^;]*;\n/, `$&import { toast } from ${importPath};\n`);
  }

  // Replace each individual alert
  const alertMatches = [...code.matchAll(/alert\(([\s\S]*?)\);/g)];
  for (const match of alertMatches) {
    const fullMatch = match[0];
    const content = match[1];

    const lowerContent = content.toLowerCase();
    
    let isSuccess = false;
    if (lowerContent.includes("success") || 
        lowerContent.includes("بنجاح") || 
        lowerContent.includes("enrolled!") || 
        lowerContent.includes("تم إيقاف") ||
        lowerContent.includes("check your email")) {
      isSuccess = true;
    }

    const replacement = isSuccess ? `toast.success(${content});` : `toast.error(${content});`;
    code = code.replace(fullMatch, replacement);
  }

  if (code !== originalCode) {
    fs.writeFileSync(filePath, code);
    console.log("Updated", filePath);
  }
}

const filesToUpdate = [
  "src/components/Register.tsx",
  "src/components/Profile.tsx",
  "src/components/AssignmentWizard/AssignmentDashboard.tsx",
  "src/components/MySession.tsx",
  "src/components/ControlPanel.tsx"
];

for (const file of filesToUpdate) {
  replaceAlerts(file);
}
