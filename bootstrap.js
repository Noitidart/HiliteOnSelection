const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const self = {
	id: 'HilteOnSelection',
	suffix: '@jetpack',
	path: 'chrome://hiliteonselection/content/',
	aData: 0,
};

const myServices = {};
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');
XPCOMUtils.defineLazyGetter(myServices, 'as', function(){ return Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService) });

function console() {
	return Services.appShell.hiddenDOMWindow.console;
}

 var selectionListener = {
   timeout: 0,
   timeoutWin: 0,
   notifySelectionChanged: function(doc, sel, reason)
   {
		if (reason == Ci.nsISelectionListener.SELECTALL_REASON) {
			
			return;
		}
		
       if (!this.timeout) {
			this.timeoutWin = doc.defaultView;
           this.timeout = doc.defaultView.setTimeout(function() {
               //console.log('notifySelectionChanged','doc=',doc,'sel=',sel,'reason=',reason);
			   hiliteAllSel(doc.defaultView, sel.toString());
               this.timeout = 0;
           }, 1000);
       } else {
			this.timeoutWin.clearTimeout(this.timeout);
           this.timeoutWin.setTimeout(function() {
               //console.log('notifySelectionChanged','doc=',doc,'sel=',sel,'reason=',reason);
			   hiliteAllSel(doc.defaultView, sel.toString());
               this.timeout = 0;
           }, 1000);
	   }
   }
 }
/********************************************/
//hilite all stuff
 function hiliteAllSel(win, text) {
	//win should be top level window, will make it top if the top isnt passed
	//should be tab windows, so no chrome windows
	win = win.top;
	
	//clear any present highlighting
	/*
	var DOMWin = win.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIWebNavigation)
					.QueryInterface(Ci.nsIDocShellTreeItem)
					.rootTreeItem
					.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIDOMWindow);
	var tab = DOMWin.gBrowser._getTabForContentWindow(win);
	var findbar = tab._findBar;
	if (findbar) {
		findbar.toggleHighlight(false);
	}
	*/
	
	
	var doc = win.document;
	
var ctrler = _getSelectionController(win);

////unighlight alll
let sel = ctrler.getSelection(Ci.nsISelectionController.SELECTION_FIND);
sel.removeAllRanges();
///end unhilite all

var searchRange = doc.createRange();
if (doc.body) {
	searchRange.selectNodeContents(doc.body);
} else {
	searchRange.selectNodeContents(doc.documentElement);
}

let startPt = searchRange.cloneRange();
startPt.collapse(true);

let endPt = searchRange.cloneRange();
endPt.collapse(false);

let retRange = null;


let finder = Cc["@mozilla.org/embedcomp/rangefind;1"].createInstance().QueryInterface(Ci.nsIFind);
finder.caseSensitive = false;
//var i = 0;
while (retRange = finder.Find(text, searchRange, startPt, endPt)) {
    //i++;
    //var stCont = retRange.startContainer;
    //var endCont = retRange.endContainer;
    
    //console.log('retRange(' + i + ') = ', retRange);
    //console.log('var txt = retRange.commonAncestorContainer.data',retRange.commonAncestorContainer.data);
    
	_highlightRange(retRange, ctrler);
    
    //break;
    startPt = retRange.cloneRange();
    startPt.collapse(false);
}
 }

/*stuff jacked straight from Finder.jsm*/
var _editors;
var _stateListeners;

function _getEditableNode(aNode) {
    while (aNode) {
      if (aNode instanceof Ci.nsIDOMNSEditableElement)
        return aNode.editor ? aNode : null;

      aNode = aNode.parentNode;
    }
    return null;
  }
  
function _highlightRange(aRange, aController) {
    let node = aRange.startContainer;
    let controller = aController;

    let editableNode = _getEditableNode(node);
    if (editableNode)
      controller = editableNode.editor.selectionController;

    let findSelection = controller.getSelection(Ci.nsISelectionController.SELECTION_FIND);
    findSelection.addRange(aRange);
    //i dont understand stateListener stuff
    /*
    if (editableNode) {
      // Highlighting added, so cache this editor, and hook up listeners
      // to ensure we deal properly with edits within the highlighting
      if (!_editors) {
        _editors = [];
        _stateListeners = [];
      }

      let existingIndex = _editors.indexOf(editableNode.editor);
      if (existingIndex == -1) {
        let x = _editors.length;
        _editors[x] = editableNode.editor;
        _stateListeners[x] = _createStateListener();
        _editors[x].addEditActionListener(this);
        _editors[x].addDocumentStateListener(_stateListeners[x]);
      }
    }
    */
  }

  function _getSelectionController(aWindow) {
    // display: none iframes don't have a selection controller, see bug 493658
    if (!aWindow.innerWidth || !aWindow.innerHeight) //im guessing this is a check for if its a frame
      return null;

    // Yuck. See bug 138068.
    let docShell = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                          .getInterface(Ci.nsIWebNavigation)
                          .QueryInterface(Ci.nsIDocShell);

    let controller = docShell.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsISelectionDisplay)
                             .QueryInterface(Ci.nsISelectionController);
    return controller;
  }

  function _createStateListener() {
    return {
      //findbar: this,

      QueryInterface: function(aIID) {
		/*
        if (aIID.equals(Ci.nsIDocumentStateListener) ||
            aIID.equals(Ci.nsISupports))
          return this;

        throw Components.results.NS_ERROR_NO_INTERFACE;
		*/
      },

      NotifyDocumentWillBeDestroyed: function() {
        //this.findbar._onEditorDestruction(this);
      },

      // Unimplemented
      notifyDocumentCreated: function() {},
      notifyDocumentStateChanged: function(aDirty) {}
    };
  }
//http://mxr.mozilla.org/mozilla-release/source/toolkit/modules/Finder.jsm?raw=1
/********************************************/

 
function addSelectionListener(win) {
	//win is contentWindow
	win = win.top;
	var selectionObj = win.getSelection();
	if (selectionObj) {
		selectionObj.QueryInterface(Ci.nsISelectionPrivate).addSelectionListener(selectionListener);
	} else {
		console().warn('did not add to this window as selectionObj is null', selectionObj);
	}
}

function removeSelectionListener(win) {
	//win is contentWindow and should be win.top
	win = win.top;
	var selectionObj = win.getSelection();
	if (selectionObj) {
		selectionObj.QueryInterface(Ci.nsISelectionPrivate).removeSelectionListener(selectionListener);
	} else {
		console().warn('did not add to this window as selectionObj is null', selectionObj);
	}
}

function listenPageLoad(event) {
	var win = event.originalTarget.defaultView;
	if (win.frameElement) {
		return;
	} else {
		addSelectionListener(win);
	}
}

/*start - windowlistener*/
var windowListener = {
	//DO NOT EDIT HERE
	onOpenWindow: function (aXULWindow) {
		// Wait for the window to finish loading
		let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		aDOMWindow.addEventListener('load', function () {
			aDOMWindow.removeEventListener('load', arguments.callee, false);
			windowListener.loadIntoWindow(aDOMWindow, aXULWindow);
		}, false);
	},
	onCloseWindow: function (aXULWindow) {},
	onWindowTitleChange: function (aXULWindow, aNewTitle) {},
	register: function () {
		// Load into any existing windows
		let XULWindows = Services.wm.getXULWindowEnumerator(null);
		while (XULWindows.hasMoreElements()) {
			let aXULWindow = XULWindows.getNext();
			let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			windowListener.loadIntoWindow(aDOMWindow, aXULWindow);
		}
		// Listen to new windows
		Services.wm.addListener(windowListener);
	},
	unregister: function () {
		// Unload from any existing windows
		let XULWindows = Services.wm.getXULWindowEnumerator(null);
		while (XULWindows.hasMoreElements()) {
			let aXULWindow = XULWindows.getNext();
			let aDOMWindow = aXULWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
			windowListener.unloadFromWindow(aDOMWindow, aXULWindow);
		}
		//Stop listening so future added windows dont get this attached
		Services.wm.removeListener(windowListener);
	},
	//END - DO NOT EDIT HERE
	loadIntoWindow: function (aDOMWindow, aXULWindow) {
		if (!aDOMWindow) {
			return;
		}
		if (aDOMWindow.gBrowser) {
			aDOMWindow.gBrowser.addEventListener('DOMContentLoaded', listenPageLoad, false);
			if (aDOMWindow.gBrowser.tabContainer) {
				//has tabContainer
				//start - go through all tabs in this window we just added to
				var tabs = aDOMWindow.gBrowser.tabContainer.childNodes;
				for (var i = 0; i < tabs.length; i++) {
					//Cu.reportError('DOING tab: ' + i);
					var tabBrowser = tabs[i].linkedBrowser;
					var win = tabBrowser.contentWindow;
					loadIntoContentWindowAndItsFrames(win);
				}
				//end - go through all tabs in this window we just added to
			} else {
				//does not have tabContainer
				var win = aDOMWindow.gBrowser.contentWindow;
				loadIntoContentWindowAndItsFrames(win);
			}
		} else {
			//window does not have gBrowser
		}
	},
	unloadFromWindow: function (aDOMWindow, aXULWindow) {
		if (!aDOMWindow) {
			return;
		}
		if (aDOMWindow.gBrowser) {
			aDOMWindow.gBrowser.removeEventListener('DOMContentLoaded', listenPageLoad, false);
			if (aDOMWindow.gBrowser.tabContainer) {
				//has tabContainer
				//start - go through all tabs in this window we just added to
				var tabs = aDOMWindow.gBrowser.tabContainer.childNodes;
				for (var i = 0; i < tabs.length; i++) {
					//Cu.reportError('DOING tab: ' + i);
					var tabBrowser = tabs[i].linkedBrowser;
					var win = tabBrowser.contentWindow;
					unloadFromContentWindowAndItsFrames(win);
				}
				//end - go through all tabs in this window we just added to
			} else {
				//does not have tabContainer
				var win = aDOMWindow.gBrowser.contentWindow;
				unloadFromContentWindowAndItsFrames(win);
			}
		} else {
			//window does not have gBrowser
		}
	}
};
/*end - windowlistener*/


function loadIntoContentWindowAndItsFrames(win) {
	if (win.frameElement) { return }
	addSelectionListener(win);
}

function unloadFromContentWindowAndItsFrames(win) {
	if (win.frameElement) { return }
	removeSelectionListener(win);
}

function startup(aData, aReason) {
	//self.aData = aData;
	windowListener.register();
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) return;
	windowListener.unregister();
}

function install() {}

function uninstall() {}