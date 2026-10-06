const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/**/*.tsx');

for (const sourceFile of sourceFiles) {
  let changed = false;

  // Replace useStyles.something with styles.something
  const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
  for (const pa of propertyAccesses) {
    if (pa.getExpression().getText() === 'useStyles') {
      pa.getExpression().replaceWithText('styles');
      changed = true;
    }
  }

  // Restore Colors import for global scope variables that need it, but rename it to GlobalColors
  const missingColorsErrors = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
      .filter(id => id.getText() === 'Colors');

  let needsGlobalColors = false;
  for (const id of missingColorsErrors) {
      const parent = id.getParent();
      // If it's used outside a function (e.g. in an object literal at top level)
      let current = id;
      let inFunction = false;
      while (current) {
          if (current.getKind() === SyntaxKind.FunctionDeclaration || current.getKind() === SyntaxKind.ArrowFunction) {
              inFunction = true;
              break;
          }
          current = current.getParent();
      }
      if (!inFunction) {
          id.replaceWithText('GlobalColors');
          needsGlobalColors = true;
          changed = true;
      }
  }

  if (needsGlobalColors) {
      sourceFile.addImportDeclaration({
          namedImports: [{ name: 'Colors', alias: 'GlobalColors' }],
          moduleSpecifier: '@/constants/theme',
      });
      changed = true;
  }

  if (changed) {
      sourceFile.saveSync();
      console.log(`Fixed ${sourceFile.getBaseName()}`);
  }
}
