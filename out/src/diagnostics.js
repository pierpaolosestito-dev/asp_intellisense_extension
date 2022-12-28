"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToDocumentChanges = exports.refreshDiagnostics = exports.CODE_ERROR = void 0;
/** To demonstrate code actions associated with Diagnostics problems, this file provides a mock diagnostics entries. */
const antlr4ts_1 = require("antlr4ts");
const ANTLRInputStream_1 = require("antlr4ts/ANTLRInputStream");
const vscode = require("vscode");
const ASPCore2Lexer_1 = require("./parser/ASPCore2Lexer");
const ASPCore2Parser_1 = require("./parser/ASPCore2Parser");
/** String to detect in the text document. */
const END_CHARACTER_OF_A_RULE = ".";
exports.CODE_ERROR = "Errore 104";
/**
 * Analyzes the text document for problems.
 * This demo diagnostic problem provider finds all mentions of 'emoji'.
 * @param doc text document to analyze
 * @param errorDiagnostics diagnostic collection
 */
function refreshDiagnostics(doc, errorDiagnostics) {
    const regex = /\.(asp|lp|dlv)$/g;
    const atoms = [{ name: "", count: 0 }];
    if (regex.test(doc.fileName)) {
        let diagnostics = [];
        const global_constructs = [];
        for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
            const lineOfText = doc.lineAt(lineIndex);
            const input = new ANTLRInputStream_1.ANTLRInputStream(lineOfText.text);
            const aspLexer = new ASPCore2Lexer_1.ASPCore2Lexer(input);
            const tokens = new antlr4ts_1.CommonTokenStream(aspLexer);
            tokens.fill();
            const aspParser = new ASPCore2Parser_1.ASPCore2Parser(tokens);
            aspParser.removeErrorListeners();
            aspParser.addErrorListener({
                syntaxError(recognizer, offendingSymbol, line, charPositionInLine, msg, e) {
                    diagnostics.push(createDiagnostic(doc, lineOfText, lineIndex, msg, vscode.DiagnosticSeverity.Error));
                },
            });
            aspParser.program();
            const constructs = [];
            for (let i = 0; i < tokens.getTokens().length; i++) {
                const text = tokens.get(i).text;
                const type = tokens.get(i).type;
                const index = tokens.get(i).line;
                constructs.push([text, type, index]);
                global_constructs.push([text, type, index]);
            }
            //constructs.map(l => console.log(l, '\n'));
            const heads = [];
            const tails = [];
            let head = true;
            let negation = false;
            for (let i = 0; i < constructs.length; i++) {
                //TODO filtrare i token
                if (constructs[i][1] === ASPCore2Lexer_1.ASPCore2Lexer.NAF || negation) { // se sono atomi negativi non li inserisco né in coda né in testa
                    if (constructs[i][1] === ASPCore2Lexer_1.ASPCore2Lexer.CONS) {
                        negation = false;
                    }
                    else {
                        negation = true;
                    }
                    continue;
                }
                if (constructs[i][1] === ASPCore2Lexer_1.ASPCore2Lexer.CONS) { // se trovo un simbolo di constraint capisco che sono passata alla coda
                    head = !head;
                }
                if (constructs[i][1] === ASPCore2Lexer_1.ASPCore2Lexer.VARIABLE) {
                    head ? heads.push(constructs[i][0]) : tails.push(constructs[i][0]);
                }
                // constructsFiltered.push(constructs[i]);
                if (constructs[i][1] === ASPCore2Lexer_1.ASPCore2Lexer.SYMBOLIC_CONSTANT) { // se è una atomo lo salvo
                    const result = atoms.find(atom => atom.name === constructs[i][0]);
                    if (!result) {
                        atoms.push({ name: constructs[i][0], count: 1 });
                    }
                    else {
                        atoms.map(atom => {
                            atom.name === constructs[i][0] ? atom.count = atom.count + 1 : null;
                        });
                    }
                }
            }
            if (!checkSafe(heads, tails) && checkIsRule(constructs)) {
                const msg = "This rule is not safe";
                diagnostics.push(createDiagnostic(doc, lineOfText, lineIndex, msg, vscode.DiagnosticSeverity.Warning));
                //console.log('lineOfText = ', lineOfText.text, '\nlineIndex = ', lineIndex, 'msg = ', msg);
            }
            diagnostics = addWarningProbablyWrongName(diagnostics, atoms, global_constructs, doc);
        }
        //atoms.map(el=>console.log(el));
        errorDiagnostics.set(doc.uri, diagnostics);
    }
}
exports.refreshDiagnostics = refreshDiagnostics;
function addWarningProbablyWrongName(diagnostics, atoms, constructs, doc) {
    // atoms.map(el => console.log(el));
    atoms.map(atom => {
        //console.log('count ', atom.count, 'for ', atom.name);
        if (atom.count === 1) {
            const line = findElemInText(constructs, atom.name);
            //console.log('line ', line, 'for ', atom.name, 'with count ', atom.count);
            if (line !== -1) {
                const msg = `${atom.name} is used only once`;
                diagnostics.push(createDiagnostic(doc, doc.lineAt(line), line, msg, vscode.DiagnosticSeverity.Warning));
                //console.log('lineOfText = ', doc.lineAt(line), '\nlineIndex = ', line, 'msg = ', msg);
            }
        }
        else {
            //console.log('prima');
            //diagnostics.map(el => console.log(el));
            diagnostics = diagnostics.filter(obj => {
                //console.log(obj.message, ' includes with ', `${atom.name}`, '=', obj.message.includes(`${atom.name}`));
                return !obj.message.includes(`${atom.name} is used only once`);
            });
            //console.log('dopo');
            diagnostics.map(el => console.log(el));
        }
    });
    return diagnostics;
}
function findElemInText(constructs, token) {
    for (let i = 0; i < constructs.length; i++) {
        //I test sono esenti dai Warning, vanno quindi rimossi.
        const c = constructs[i][0];
        const t = token;
        const cond1 = constructs[i][0].includes(token);
        const cond2 = !constructs[i][0].includes("not");
        //console.log(constructs.toString(), '\nt = ', t, '\ncond1 = ', cond1);
        if (cond1 && cond2) {
            const index = constructs[i][2];
            return constructs[i][2] - 1;
        }
    }
    //Se non trova nulla restituisce -1
    return -1;
}
function checkRegex(lineOfText, regex, splitter) {
    const sameLine = regex.test(lineOfText);
    /*if (sameLine) {
        lineOfText = lineOfText.replace(regex, "");
    }
    */ return lineOfText.split(splitter).length > 1;
}
function checkIsRule(constructs) {
    if (constructs[0][1] !== ASPCore2Lexer_1.ASPCore2Lexer.SYMBOLIC_CONSTANT) { // non inizia con un atomo CODE 2
        return false;
    }
    for (let i = 0; i < constructs.length; i++) {
        if (constructs[i][1] === ASPCore2Lexer_1.ASPCore2Lexer.CONS) { // è presente il :-
            return true;
        }
    }
    return false;
}
function checkSafe(heads, tails) {
    let safe = true;
    if (heads.length === 0 || tails.length === 0)
        return !safe;
    tails.map((el) => {
        if (!heads.includes(el)) {
            safe = false;
        }
    });
    return safe;
}
//Crea una diagnostica, ovvero un oggetto di vscode che indica che errore c'è stato
function createDiagnostic(doc, lineOfText, lineIndex, codeError, severity) {
    // const index = lineOfText.text.indexOf(END_CHARACTER_OF_A_RULE);
    const range = new vscode.Range(lineIndex, 0, lineIndex, 0 + lineOfText.text.length);
    const diagnostic = new vscode.Diagnostic(range, codeError, severity);
    //In questa sezione di codice si inferisce qual'è la causa dell'errore
    //Modifica il messaggio d'errore in base alla causa dell'errore
    /*if(codeError == "001"){
                diagnostic.message = "The format of the aggregate is incorrect.";
                diagnostic.code = "001";
            }
            else if(codeError == "010"){
                diagnostic.message = "The format of the built-in is incorrect";
                diagnostic.code = "010";
            }*/
    return diagnostic;
}
function subscribeToDocumentChanges(context, errorDiagnostics) {
    if (vscode.window.activeTextEditor) {
        refreshDiagnostics(vscode.window.activeTextEditor.document, errorDiagnostics);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            refreshDiagnostics(editor.document, errorDiagnostics);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((e) => refreshDiagnostics(e.document, errorDiagnostics)));
    context.subscriptions.push(vscode.workspace.onDidCloseTextDocument((doc) => errorDiagnostics.delete(doc.uri)));
}
exports.subscribeToDocumentChanges = subscribeToDocumentChanges;
//# sourceMappingURL=diagnostics.js.map