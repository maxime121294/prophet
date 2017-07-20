import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class CartridgesView implements vscode.TreeDataProvider<CartridgeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<CartridgeItem | undefined> = new vscode.EventEmitter<CartridgeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<CartridgeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: CartridgeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: CartridgeItem): Thenable<CartridgeItem[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No dependency in empty workspace');
			return Promise.resolve([]);
		}

		return new Promise(resolve => {
			if (element) {
				resolve(this.getCartridgeItemFilesOrFolders(element));
			} else {
				if (this.pathExists(this.workspaceRoot)) {
					resolve(this.getCartridgesInWorkspace(this.workspaceRoot));
				} else {
					vscode.window.showInformationMessage('No workspace!');
					resolve([]);
				}
			}
		});
	}

	private getCartridgeItemFilesOrFolders(element: CartridgeItem): CartridgeItem[] {
		var files = this.getFiles(element.location);
		var directories = this.getDirectories(element.location);

		if (files.length > 0 || directories.length > 0) {
			const toFileElement = (fileName: string): CartridgeItem => {
				return new CartridgeItem(fileName, 'cartridge-item-file', path.join(element.location, fileName), vscode.TreeItemCollapsibleState.None, {
					command: 'vscode.open',
					title: 'Open file',
					arguments: [vscode.Uri.parse('file://' + path.join(element.location, fileName))],
				});
			}

			const toFolderElement = (directory: string): CartridgeItem => {
				return new CartridgeItem(directory, 'cartridge-item-folder', path.join(element.location, directory), vscode.TreeItemCollapsibleState.Collapsed);
			}

			return directories.map(toFolderElement).concat(files.map(toFileElement));
		}

		return [new CartridgeItem('No files', 'cartridge-file', '', vscode.TreeItemCollapsibleState.None)];
	}


	private getCartridgesInWorkspace(workspaceRoot: string): CartridgeItem[] {
		if (this.pathExists(workspaceRoot)) {
			var directories = this.getDirectories(workspaceRoot)

			const checkIfCartridge = (dir: string): boolean => {
				return this.pathExists(path.join(this.workspaceRoot, dir, 'cartridge'));
			};

			const toCardridge = (dir: string): CartridgeItem => {
				return new CartridgeItem(dir, 'cartridge', path.join(this.workspaceRoot, dir, 'cartridge'), vscode.TreeItemCollapsibleState.Collapsed);
			}

			let filteredDirectories = directories.filter(checkIfCartridge);

			if (filteredDirectories.length > 0) {
				return filteredDirectories.map(toCardridge);
			} else {
				return [new CartridgeItem('No cartridges found in this workspace.', 'cartridge', this.workspaceRoot, vscode.TreeItemCollapsibleState.None)];
			}
		} else {
			return [];
		}
	}

	private getDirectories(srcpath) {
		return fs.readdirSync(srcpath)
			.filter(file => fs.lstatSync(path.join(srcpath, file)).isDirectory())
	}

	private getFiles(srcpath) {
		return fs.readdirSync(srcpath)
			.filter(file => !fs.lstatSync(path.join(srcpath, file)).isDirectory())
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

class CartridgeItem extends vscode.TreeItem {
	fileExtension: string;

	constructor(
		public readonly name: string,
		public readonly type: string,
		public readonly location: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(name, collapsibleState);

		this.location = location;
		this.type = type;

		if (this.type === 'cartridge-item-file') {
			this.fileExtension = path.extname(this.name).replace('.', '');

			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'images', 'resources', this.fileExtension + '.svg'),
				dark: path.join(__filename, '..', '..', '..', 'images', 'resources', this.fileExtension + '.svg')
			};

			this.contextValue = 'file';
		}
		else if (this.type === 'cartridge-item-folder') {
			this.contextValue = 'folder';
		} else {
			this.contextValue = 'cartridge';

			this.iconPath = {
				light: path.join(__filename, '..', '..', '..', 'images', 'resources', 'cartridge.svg'),
				dark: path.join(__filename, '..', '..', '..', 'images', 'resources', 'cartridge.svg')
			};

		}
	}
}