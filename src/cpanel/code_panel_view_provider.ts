import * as vscode from 'vscode';
import { PATH_TO_COOKBOOK_EXAMPLES } from '../utils/consts';
import * as cpanel from './run';

export class CodePanelViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'asp-panel.ASPCookbook';

	constructor(
		private readonly _extension: vscode.ExtensionContext,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
			enableForms: true,
			enableCommandUris:true,

			localResourceRoots: [
				this._extension.extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			// select text
			const active = vscode.window.activeTextEditor;
			if (!active) { return; } // null check

			const selection = active.selection;
			if (!selection) { return; } // null check

			switch (data.type) {
				// DLV
                case 'ADVANCED_KNAPSACK_PROBLEM':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extension.extensionUri);
                        editBuilder.replace(selection, code.dlv(this._extension.asAbsolutePath(PATH_TO_COOKBOOK_EXAMPLES.ADVANCED_KNAPSACK_PROBLEM))); 
                    });
                    break;
                case 'KNAPSACK_PROBLEM':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extension.extensionUri);
                        editBuilder.replace(selection, code.dlv(this._extension.asAbsolutePath(PATH_TO_COOKBOOK_EXAMPLES.KNAPSACK_PROBLEM)));
                    });
                    break;
                case '3_COLORABILITY':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extension.extensionUri);
                        editBuilder.replace(selection, code.dlv(this._extension.asAbsolutePath(PATH_TO_COOKBOOK_EXAMPLES.THREE_COLORABILITY)));
                    });
                    break;
                case 'HAMILTON_PATH':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extension.extensionUri);
                        editBuilder.replace(selection, code.dlv(this._extension.asAbsolutePath(PATH_TO_COOKBOOK_EXAMPLES.HAMILTON_PATH)));
                    });
                    break;
                case 'MINIMUM_SPANNING_TREE':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extension.extensionUri);
                        editBuilder.replace(selection, code.dlv(this._extension.asAbsolutePath(PATH_TO_COOKBOOK_EXAMPLES.MINIMUM_SPANNING_TREE)));
                    });
                    break;
                case 'SEATING':
                    active.edit(editBuilder => {
                        const code = new cpanel.Code(this._extension.extensionUri);
                        editBuilder.replace(selection, code.dlv(this._extension.asAbsolutePath(PATH_TO_COOKBOOK_EXAMPLES.SEATING)));
                    });
                    break;
                case 'STRATEGIC_COMPANIES':
                active.edit(editBuilder => {
                    const code = new cpanel.Code(this._extension.extensionUri);
                    editBuilder.replace(selection, code.dlv(this._extension.asAbsolutePath(PATH_TO_COOKBOOK_EXAMPLES.STRATEGIC_COMPANIES)));
                });
                break;
                case 'VERTEX_COVER':
                active.edit(editBuilder => {
                    const code = new cpanel.Code(this._extension.extensionUri);
                    editBuilder.replace(selection, code.dlv(this._extension.asAbsolutePath(PATH_TO_COOKBOOK_EXAMPLES.VERTEX_COVER)));
                });
                break;
                // showPanel
                case 'showPanel':
                    this.showPanel(webviewView.webview);
                    break;
			}
		});

		vscode.window.onDidChangeActiveTextEditor((editor) => {
			this.showPanel(webviewView.webview);
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Do the same for the stylesheet.
		const styleBootStrapUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extension.extensionUri, 'media', 'css', 'bootstrap.min.css'));
		// const styleBootStrapIconUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'bootstrap-icon', 'bootstrap-icons.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extension.extensionUri, 'media', 'css', 'main.css'));

		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptBootStrapUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extension.extensionUri, 'media', 'js', 'bootstrap.min.js'));
		const scriptMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extension.extensionUri, 'media', 'js', 'main.js'));


		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();
		const cpBody = getCodePanelBody();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' data: ${webview.cspSource}; font-src 'self' data: ${webview.cspSource}; img-src 'self' data: ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleBootStrapUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>ASP Cookbook</title>
			</head>
			<body class="text-white" oncopy="return false;">
				${cpBody}
				<script nonce="${nonce}" src="${scriptBootStrapUri}"></script>
				<script nonce="${nonce}" src="${scriptMainUri}"></script>
			</body>
			</html>`;
	}

	private showPanel(webview: vscode.Webview) {
		const active = vscode.window.activeTextEditor;
		if (!active) return;
		const type = active.document.fileName.split('.').pop();
		webview.postMessage({ command: type });
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getCodePanelBody() {
	const htmlBody = `
    <div class="container m-2">
        

		<!--
			// ///////////////////////////////
			// DLV Panel
			// ///////////////////////////////
		-->
        <h1>Cookbook</h1>
        <div class="panel panel-primary panel-dlv">
            <div class="panel-heading">
                <h3>With Input</h3>
            </div>
            <div class="panel-body">
                <div class="row">
					<div class="col-12 col-xs-12 col-md-12">
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="VERTEX_COVER"><span class="panel-title">Vertex Cover</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="HAMILTON_PATH"><span class="panel-title">Hamilton Path</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="STRATEGIC_COMPANIES"><span class="panel-title">Strategic Companies</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="3_COLORABILITY"><span class="panel-title">3 Colorability</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="SEATING"><span class="panel-title">Seating</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="MINIMUM_SPANNING_TREE"><span class="panel-title">Minimum Spanning Tree</span></a>
						<a href="#" class="btn btn-secondary btn-sm m-1" role="button" data-act="KNAPSACK_PROBLEM"><span class="panel-title">Knapsack Problem</span></a>
					</div>
                </div>
            </div>
    </div><div id="check"></div>
	`;
    return htmlBody;
}