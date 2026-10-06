const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles('src/**/*.tsx');

for (const sourceFile of sourceFiles) {
  const imports = sourceFile.getImportDeclarations();
  let usesThemeColors = false;

  // Check if imports Colors from theme
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier === '@/constants/theme' || moduleSpecifier === '../../constants/theme' || moduleSpecifier === '../constants/theme') {
      const namedImports = imp.getNamedImports();
      const colorsImport = namedImports.find(n => n.getName() === 'Colors');
      
      if (colorsImport) {
        usesThemeColors = true;
        colorsImport.remove();
        
        // Remove empty import
        if (imp.getNamedImports().length === 0) {
          imp.remove();
        }
      }
    }
  }

  if (!usesThemeColors) continue;

  // Add ThemeProvider import
  sourceFile.addImportDeclaration({
    namedImports: ['useAppTheme'],
    moduleSpecifier: '@/providers/ThemeProvider',
  });

  // Find StyleSheet.create
  let hasStyles = false;
  const variableDeclarations = sourceFile.getVariableDeclarations();
  for (const varDecl of variableDeclarations) {
    if (varDecl.getName() === 'styles') {
      const init = varDecl.getInitializer();
      if (init && init.getKind() === SyntaxKind.CallExpression) {
        const expr = init.getExpression().getText();
        if (expr === 'StyleSheet.create') {
          hasStyles = true;
          // Change to: const useStyles = (Colors: any) => StyleSheet.create(...)
          varDecl.rename('useStyles');
          const args = init.getArguments();
          if (args.length > 0) {
             const styleObj = args[0].getText();
             init.replaceWithText(`(Colors: any) => StyleSheet.create(${styleObj})`);
          }
        }
      }
    }
  }

  // Inject hook into React components
  const functions = sourceFile.getFunctions();
  for (const func of functions) {
    // If name starts with uppercase, it's likely a React component
    const name = func.getName();
    if (name && /^[A-Z]/.test(name)) {
      const body = func.getBody();
      if (body && body.getKind() === SyntaxKind.Block) {
        let injected = `const { colors: Colors } = useAppTheme();\n`;
        if (hasStyles) {
          injected += `  const styles = useStyles(Colors);\n`;
        }
        body.insertStatements(0, injected);
      }
    }
  }
  
  const arrowFunctions = sourceFile.getVariableDeclarations().filter(v => v.getInitializer()?.getKind() === SyntaxKind.ArrowFunction);
  for (const arrow of arrowFunctions) {
    const name = arrow.getName();
    if (name && /^[A-Z]/.test(name)) {
      const init = arrow.getInitializer();
      const body = init.getBody();
      if (body.getKind() === SyntaxKind.Block) {
        let injected = `const { colors: Colors } = useAppTheme();\n`;
        if (hasStyles) {
          injected += `  const styles = useStyles(Colors);\n`;
        }
        body.insertStatements(0, injected);
      }
    }
  }

  sourceFile.saveSync();
  console.log(`Refactored ${sourceFile.getBaseName()}`);
}
