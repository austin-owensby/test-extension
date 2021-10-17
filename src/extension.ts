import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SettingsPanel } from './panels/settingsPanel';
import { CSharp } from './utilities/csharp';
import { getNamespaceName } from './utilities/helpers';
import { generateTypescriptClass, generateBackendService, generateBackendServiceInterface } from './utilities/generateFiles';

export function activate(context: vscode.ExtensionContext) {
	let rootPath: string = '';
	if (vscode.workspace.workspaceFolders !== undefined) {
		rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
	}

	// Navigate to the Workspace's settings
	context.subscriptions.push(vscode.commands.registerCommand('csharp-bootstrapper.settings', () => {
		// For some reason this is really finikey and the only reliable way to trigger this
		vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
		vscode.commands.executeCommand('workbench.action.openSettings', 'csharp-bootstrapper');
		vscode.commands.executeCommand('workbench.action.openWorkspaceSettings');
	}));

	// Generate a Typescript file based on the current C# model
	context.subscriptions.push(vscode.commands.registerCommand('csharp-bootstrapper.convert-model', (uri: vscode.Uri) => {
		try {
			if (uri) {
				// Get the document text
				const documentText: string = fs.readFileSync(uri.fsPath).toString();

				const parsedClasses = CSharp.parseClasses(documentText);
				if (!parsedClasses.length) {
					vscode.window.showErrorMessage('C# Bootstrapper: No class name detected.');
					return;
				}

				for (let parsedClass of parsedClasses) {
					// Generate the file path
					const frontendTargetDirectory: string = vscode.workspace.getConfiguration().get('csharp-bootstrapper.frontend.model.directory', '');
					const modelPath: string = path.join(rootPath, frontendTargetDirectory, `${parsedClass.className}.ts`);

					const fileContents: string = generateTypescriptClass(parsedClass.className);

					try {
						fs.writeFileSync(modelPath, fileContents);
						// file written successfully, navigate to it
						vscode.window.showTextDocument(vscode.Uri.file(modelPath), { preview: false });
					} catch (e) {
						vscode.window.showErrorMessage('C# Bootstrapper: Error creating typescript file.');
						console.error(e);
					}
				}
			}
			else {
				vscode.window.showErrorMessage('C# Bootstrapper: No file found.');
			}
		}
		catch (e) {
			vscode.window.showErrorMessage('C# Bootstrapper: An unknown error occured.');
			console.error(e);
		}
	}));

	// Generate a the CRUD workflow for the C# model based on the configurations
	context.subscriptions.push(vscode.commands.registerCommand('csharp-bootstrapper.bootstrap-crud', (uri:vscode.Uri) => {
		try{
			if (uri) {	
				// Get the document text
				const documentText: string = fs.readFileSync(uri.fsPath).toString();

				const namespaceName: string = getNamespaceName(documentText);
				const parsedClasses = CSharp.parseClasses(documentText);
				if (!parsedClasses.length) {
					vscode.window.showErrorMessage('C# Bootstrapper: No class name detected.');
					return;
				}

				for (let parsedClass of parsedClasses) {
					const serviceFileContents = generateBackendService(parsedClass.className, namespaceName);
					const backendServiceDirectory = vscode.workspace.getConfiguration().get('csharp-bootstrapper.backend.service.directory', '');
					const backendServicePath = path.join(rootPath, backendServiceDirectory, `${parsedClass.className}Service.cs`);

					try {
						fs.writeFileSync(backendServicePath, serviceFileContents);
					} catch (e) {
						vscode.window.showErrorMessage('C# Bootstrapper: Error creating backend service.');
						console.error(e);
					}

					const serviceInterfaceFileContents= generateBackendServiceInterface(parsedClass.className, namespaceName);
					const backendServiceInterfaceDirectory = vscode.workspace.getConfiguration().get('csharp-bootstrapper.backend.service.interface.directory', '');
					const backendServiceInterfacePath = path.join(rootPath, backendServiceInterfaceDirectory, `I${parsedClass.className}Service.cs`);
					
					try {
						fs.writeFileSync(backendServiceInterfacePath, serviceInterfaceFileContents);
					} catch (e) {
						vscode.window.showErrorMessage('C# Bootstrapper: Error creating backend service interface.');
						console.error(e);
					}
				}
			}
			else{
				vscode.window.showErrorMessage('C# Bootstrapper: No file found.');
			}
		}
		catch (e) {
			vscode.window.showErrorMessage('C# Bootstrapper: An unknown error occured.');
			console.error(e);
		}
	}));

	// Display a WebView to edit settings through a more focused GUI
	context.subscriptions.push(vscode.commands.registerCommand('csharp-bootstrapper.settings-gui', () => {
		SettingsPanel.render(context.extensionUri);
	}));
}

export function deactivate() { }
