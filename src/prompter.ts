import { CODE_ERROR} from './diagnostics';
import { similarity } from './utils/similarity';
import { dictionarizer } from './utils/dictionarizer';
import { DynamicPredicateDictionary } from './intellisense/dynamic_predicate_dictionary';
import * as path from 'path';
import * as vscode from 'vscode';
import { PATH_TO_JSON_DICTIONARY } from './utils/consts';

const COMMAND = 'code-actions-sample.command';

export class Prompter implements vscode.CodeActionProvider {

	context : vscode.ExtensionContext;

	constructor(context:vscode.ExtensionContext) {
		this.context = context;
	}

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	

	public addConstantFixer(m1:string,constantsDict:any,document:vscode.TextDocument,range:vscode.Range,result:any[]){
		let commandAction = null;
		for(const elem of Object.values<any>(constantsDict['language-constants'])) {
						
			if(similarity(m1,elem) == 1.00){
				return;
			}
			if(similarity(m1,elem)>=0.5 && similarity(m1,elem)<1.00){
				const replaceWithRightConstant = this.createFix(document,range,elem,elem.length);
				commandAction = this.createCommand();
				result.push(replaceWithRightConstant);
				
				
			}

		}
		if(commandAction){
			result.push(commandAction);
		}
	}

	public addDynamicPredicateFixer(m1:string,dd:DynamicPredicateDictionary,key:string,document:vscode.TextDocument,range:vscode.Range,result:any[]){
		let commandAction = null;
		for(const elem of Object.values<any>(dd.get_field(key))) {
			const indexOf = elem.label.indexOf("(");
			const substringToCompare = elem.label.substring(0,indexOf);
			if(similarity(m1,substringToCompare)>=0.5 && similarity(m1,substringToCompare)<1.00){
				const replaceWithRightAggregate = this.createFix(document,range,substringToCompare,substringToCompare.length);
				commandAction = this.createCommand();
				result.push(replaceWithRightAggregate);
			}
		}
	}
	public addFixers(match:string,dictionary : any, document:vscode.TextDocument,range:vscode.Range, prefix:string, otherPrefix = "", result :any[]){
		let commandAction = null;
		if(otherPrefix == ""){ 
			for(const elem of Object.values<any>(dictionary[prefix])) {
			if(similarity(match,prefix+elem.label+"{")>=0.5 && similarity(match,prefix+elem.label+"{")<1.00){
				const replaceWithRightBuiltin = this.createFix(document,range,prefix+elem.label+"{",(prefix+elem.label+"{").length);
				commandAction = this.createCommand();
				result.push(replaceWithRightBuiltin);
			}
		}
	}else{
		for(const elem of Object.values<any>(dictionary[prefix])) {
			if(similarity(match,otherPrefix+elem.label+"{")>=0.5 && similarity(match,otherPrefix+elem.label+"{")<1.00){
				const replaceWithRightBuiltin = this.createFix(document,range,prefix+elem.label+"{",(prefix+elem.label+"{").length);
				commandAction = this.createCommand();
				result.push(replaceWithRightBuiltin);
			}
		}
		
	}
	if(commandAction){
		result.push(commandAction);
	}
	}

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
	const result : any[]= [];
	if (this.isAtStartOfAggregate(document, range)) {
		
		let aggregatesDict = dictionarizer(this.context.asAbsolutePath(PATH_TO_JSON_DICTIONARY.AGGREGATES)); //La dobbiamo leggere da aggregates.json
		const start = range.start;
		const line = document.lineAt(start.line).text;
		const aggregateRegex = /(#\w+)\{/gm; 
		const matches = line.matchAll(aggregateRegex);
		if(matches){
		for(const match of matches){
			const m1 = match[1];			
			if(m1){
				this.addFixers(m1,aggregatesDict,document,range,"#","",result);
				//&coutn
				if(result.length == 0){
					aggregatesDict = dictionarizer(this.context.asAbsolutePath(PATH_TO_JSON_DICTIONARY.BUILTINS));
					this.addFixers(m1,aggregatesDict,document,range,"&","#",result); //#coutn
				}
			}
		}
	}
	
	}
	if (this.isAtStartOfBuiltins(document, range)) {
		
		let builtinsDict = dictionarizer(this.context.asAbsolutePath(PATH_TO_JSON_DICTIONARY.BUILTINS)); //La dobbiamo leggere da aggregates.json
		const start = range.start;
		const line = document.lineAt(start.line).text;
		const builtinRegex = /(&\w+)\{/gm;
		const matches = line.matchAll(builtinRegex);
		if(matches){
			
		for(const match of matches){
			const m1 = match[1];			
			if(m1){
				this.addFixers(m1,builtinsDict,document,range,"&","",result);
				
				if(result.length == 0){

					builtinsDict = dictionarizer(this.context.asAbsolutePath(PATH_TO_JSON_DICTIONARY.AGGREGATES));
					this.addFixers(m1,builtinsDict,document,range,"#","&",result);
				}
			}
		}
	}
	
	}
	
	if(this.isAtStartOfConstants(document,range)){
		const constantsDict = dictionarizer(this.context.asAbsolutePath(PATH_TO_JSON_DICTIONARY.CONSTANTS)); //La dobbiamo leggere da aggregates.json
		const start = range.start;
		const line = document.lineAt(start.line).text;
		const constantsRegex = /([A-Z]+_+)*[A-Z]+/gm; //#count{}
		const matches = line.matchAll(constantsRegex);
		if(matches){
			for(const match of matches){
				const m1 = match[0];			
				if(m1){
					this.addConstantFixer(m1,constantsDict,document,range,result);
				}
			}
		}
	}
	if (this.isAtStartOfDynamicPredicates(document, range)) {
		//Starting point for dynamic predicates correction
		const chiave = path.basename(document.fileName);
		const dd = DynamicPredicateDictionary.getInstance();
		const start = range.start;
		const line = document.lineAt(start.line).text;
		const aggregateRegex = /(\w+)\(/gm;
		const matches = line.matchAll(aggregateRegex);
		
		if(matches){
			for(const match of matches){
				const m1 = match[1];			
				if(m1){
					this.addDynamicPredicateFixer(m1,dd,chiave,document,range,result);			
				}
			}
		}
		
	}

	return result;
	}

	public isAtStartOfAggregate(document:vscode.TextDocument,range:vscode.Range){
		const start = range.start;
		const line = document.lineAt(start.line);
		return line.text[start.character] === "#";
	}

	public isAtStartOfBuiltins(document:vscode.TextDocument,range:vscode.Range){
		const start = range.start;
		const line = document.lineAt(start.line);
		return line.text[start.character] === "&";
	}

	public isAtStartOfDynamicPredicates(document:vscode.TextDocument,range:vscode.Range){
		const start = range.start;
		const line = document.lineAt(start.line);
		return line.text[start.character].match(/[a-zA-Z]/gm);
	}

	public isAtStartOfConstants(document:vscode.TextDocument,range:vscode.Range){
		const start = range.start;
		const line = document.lineAt(start.line);
		return line.text[start.character].match(/[A-Z_]/gm);
	}


	public createFix(document: vscode.TextDocument, range: vscode.Range, expected_string: string, endstring=2): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Convert to ${expected_string}`, vscode.CodeActionKind.QuickFix);
		fix.edit = new vscode.WorkspaceEdit();
		fix.edit.replace(document.uri, new vscode.Range(range.start, range.start.translate(0, endstring)), expected_string);
		return fix;
	}

	public createCommand(): vscode.CodeAction {
		const action = new vscode.CodeAction('Learn more about ASP', vscode.CodeActionKind.Empty);
		action.command = { command: COMMAND, title: 'Learn more about ASP. (Documentation)', tooltip: 'This will open the ASP documentation.' };
		return action;
	}
}

/*export class PrompterInfo implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		// for each diagnostic entry that has the matching `code`, create a code action command
		return context.diagnostics
			.filter(diagnostic => diagnostic.code === CODE_ERROR)
			.map(diagnostic => this.createCommandCodeAction(diagnostic));
	}

	public createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
		const action = new vscode.CodeAction('Fix rule', vscode.CodeActionKind.QuickFix);
		action.command = { command: COMMAND, title: 'Fix rule.', tooltip: 'Fix rule' };
		
		action.diagnostics = [diagnostic];
		action.isPreferred = true;
		return action;
	}
	
}*/
