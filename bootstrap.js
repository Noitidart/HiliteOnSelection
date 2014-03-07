const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const self = {
	id: 'HilteOnSelection',
	suffix: '@jetpack',
	path: 'chrome://hiliteonselection/content/',
	aData: 0,
};

Cu.import('resource://gre/modules/Services.jsm');
var addedListeners = [];

function console() {
	return Services.appShell.hiddenDOMWindow.console;
}

function selectionListener(win) {
	this.timeout = 0;
	this.win = 0;
	this._editors = [];
	this._stateListeners = [];
   this.notifySelectionChanged = function(doc, sel, reason)
   {
		if (reason == Ci.nsISelectionListener.SELECTALL_REASON) {
			
			return;
		}

		var postTimeout = function() {
               //console.log('notifySelectionChanged','doc=',doc,'sel=',sel,'reason=',reason);
			   hiliteAllSel(this.win, sel.toString(), this._editors);
               this.timeout = 0;
           }		
       if (this.timeout === 0) {
			this.win = doc.defaultView;
			//console().log('set this.win',this.win,'doc.defaultView=',doc.defaultView);
           this.timeout = this.win.setTimeout(postTimeout.bind(this), 1000);
       } else {
			this.win.clearTimeout(this.timeout);
           this.win.setTimeout(postTimeout.bind(this), 1000);
	   }
   }
	
}
/*
 var selectionListener = {
   timeout: 0,
   timeoutWin: 0,

 }
 */
/********************************************/
//hilite all stuff
 function hiliteAllSel(win, text, _editors) {
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
if (_editors) {
for (let x = _editors.length - 1; x >= 0; --x) {
if (_editors[x].document == doc) {
sel = _editors[x].selectionController.getSelection(Ci.nsISelectionController.SELECTION_FIND);
sel.removeAllRanges();
// We don't need to listen to this editor any more
//this._unhookListenersAtIndex(x);
}
}
}
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
    
	_highlightRange(retRange, ctrler, _editors);
    
    //break;
    startPt = retRange.cloneRange();
    startPt.collapse(false);
}
 }

/*stuff jacked straight from Finder.jsm*/
function _getEditableNode(aNode) {
    while (aNode) {
      if (aNode instanceof Ci.nsIDOMNSEditableElement)
        return aNode.editor ? aNode : null;

      aNode = aNode.parentNode;
    }
    return null;
  }
  
function _highlightRange(aRange, aController, _editors) {
    let node = aRange.startContainer;
    let controller = aController;

    let editableNode = _getEditableNode(node);
    if (editableNode)
      controller = editableNode.editor.selectionController;

    let findSelection = controller.getSelection(Ci.nsISelectionController.SELECTION_FIND);
    findSelection.addRange(aRange);
    //i dont understand stateListener stuff
    
    if (editableNode) {
      // Highlighting added, so cache this editor, and hook up listeners
      // to ensure we deal properly with edits within the highlighting

      let existingIndex = _editors.indexOf(editableNode.editor);
	  existingIndex = -1;
      if (existingIndex == -1) {
        let x = _editors.length;
        _editors[x] = editableNode.editor;
        //_stateListeners[x] = _createStateListener();
        //_editors[x].addEditActionListener(this);
        //_editors[x].addDocumentStateListener(_stateListeners[x]);
      }
    }
    
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
		var listenerForThisWin = new selectionListener;
		selectionObj.QueryInterface(Ci.nsISelectionPrivate).addSelectionListener(listenerForThisWin);
		addedListeners.push([win, listenerForThisWin]);
	} else {
		//console().warn('did not add to this window as selectionObj is null', selectionObj);
	}
}

function removeSelectionListener(win) {
	//win is contentWindow and should be win.top
	win = win.top;
	var selectionObj = win.getSelection();
	if (selectionObj) {
		selectionObj.QueryInterface(Ci.nsISelectionPrivate).removeSelectionListener(selectionListener);
	} else {
		//console().warn('did not add to this window as selectionObj is null', selectionObj);
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
		[].forEach.call(addedListeners, function(listener) {
			//listener[0] == win
			//listener[1] == new selectionListener
			//console().log('going through addedListeners, currently on win=',listener[0]);
			try {
				var selectionObj = listener[0].getSelection();
				if (selectionObj) {
					selectionObj.QueryInterface(Ci.nsISelectionPrivate).removeSelectionListener(listener[1]);
					//unhilite any hilites that were there
					var ctrler = _getSelectionController(listener[0]);
					let sel = ctrler.getSelection(Ci.nsISelectionController.SELECTION_FIND);
					sel.removeAllRanges();
				} else {
					//console().warn('did not REMOVE from this window as selectionObj is null', selectionObj, 'here is the listener[1]',listener[1]);
				}
			} catch(ex) {
				//console().warn('exception while removing selectionListener=',ex);
			}
		});
		
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
			return; //no longer doing the bottom as dealing with constuctor now
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