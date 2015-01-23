var path = require('path');
var apd = require('atom-package-dependencies');
var programManager = require('./lang/programManager');
var errorView = require('./atom/errorView');
var statusBar;
var statusBarMessage;
var editorWatch;
var autoCompleteWatch;
function activate(state) {
    var linter = apd.require('linter');
    var acp = apd.require('autocomplete-plus');
    if (!linter || !acp) {
        apd.install(function () {
            atom.notifications.addSuccess("Some dependent packages were required for atom-typescript. These are now installed. Best you restart atom just this once.", { dismissable: true });
        });
        return;
    }
    atom.packages.once('activated', function () {
        errorView.start();
        editorWatch = atom.workspace.observeTextEditors(function (editor) {
            var filePath = editor.getPath();
            var filename = path.basename(filePath);
            var ext = path.extname(filename);
            if (ext == '.ts') {
                try {
                    var program = programManager.getOrCreateProgram(filePath);
                    editor.onDidStopChanging(function () {
                        program.languageServiceHost.updateScript(filePath, editor.getText());
                        errorView.setErrors(programManager.getErrorsForFile(filePath));
                    });
                    editor.onDidSave(function (event) {
                        program.languageServiceHost.updateScript(filePath, editor.getText());
                        var output = program.emitFile(filePath);
                        errorView.showEmittedMessage(output);
                    });
                }
                catch (ex) {
                    console.error('Solve this in atom-typescript', ex);
                    throw ex;
                }
            }
        });
        atom.packages.activatePackage('autocomplete-plus').then(function (pkg) {
            var autoComplete = pkg.mainModule;
        });
    });
}
exports.activate = activate;
function deactivate() {
    if (statusBarMessage)
        statusBarMessage.destroy();
    if (editorWatch)
        editorWatch.dispose();
    if (autoCompleteWatch)
        autoCompleteWatch.dispose();
}
exports.deactivate = deactivate;
function serialize() {
    return {};
}
exports.serialize = serialize;
function deserialize() {
}
exports.deserialize = deserialize;