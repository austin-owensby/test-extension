import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
	let rootPath = '';
	if(vscode.workspace.workspaceFolders !== undefined){
		rootPath = vscode.workspace.workspaceFolders[0].uri.path;
	}

	context.subscriptions.push(vscode.commands.registerCommand('csharp-bootstrapper.settings', () => {
		// For some reason this is really finikey and the only reliable way to trigger this
		vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
		vscode.commands.executeCommand('workbench.action.openSettings', 'C# Bootstrapper');
		vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('csharp-bootstrapper.globalSettings', () => {
		vscode.commands.executeCommand('workbench.action.openSettings', 'C# Bootstrapper');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('csharp-bootstrapper.convertModel', () => {
		try{
			// Get the active text editor
			const editor = vscode.window.activeTextEditor;
	
			if (editor) {
				let document = editor.document;
	
				// Get the document text
				const documentText = document.getText();
	
				// Get class name from the documen\
				const documentTextArray = documentText.split('class ');
				if(documentTextArray.length < 1){
					vscode.window.showErrorMessage('No class name detected.');
					return;
				}
	
				const textAfterClass = documentText.split('class ')[1];
				let className = textAfterClass.split(' ')[0].split(':')[0].trim();
	
				// Generate the filename
				const lowercaseClassName = className.charAt(0).toLowerCase() + className.slice(1);
	
				if(!lowercaseClassName){
					vscode.window.showErrorMessage('No class name detected.');
					return;
				}
	
				const outputFilename = `${lowercaseClassName}.ts`;
	
				// Generate the file path
				const path = `${rootPath}/${vscode.workspace.getConfiguration().get('csharp-bootstrapper.frontendModelDirectory')}/${outputFilename}`;
				const fileContents = generateTypescriptClass(className, textAfterClass);
	
				try {
					fs.writeFileSync(path, fileContents);
					// file written successfully, navigate to it
					let newUri = document.uri.with({ path: path });
					vscode.window.showTextDocument(newUri, { preview: false });
				} catch (e) {
					vscode.window.showErrorMessage('Error creating typescript file.');
					console.error(e);
				}
			}
			else{
				vscode.window.showErrorMessage('No active file.');
			}
		}
		catch (e) {
			vscode.window.showErrorMessage('An unknown error occured.');
			console.error(e);
		}
	}));
}

export function deactivate() {}


function generateTypescriptClass(className: string, text: string): string {
	let fileContents = `export interface I${className} {\n`;



	fileContents += `}

export class ${className}Dto implements I${className} {
`;



	fileContents += `}

export class ${className} extends ${className}Dto {
	constructor(dto? : ${className}Dto){
		super();

		if (dto) {
			Object.assign(this, dto);
		}
	}
}
`;

	return fileContents;
}