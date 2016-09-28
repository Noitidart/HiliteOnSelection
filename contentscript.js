var t = '';
var isMarked = 0;
function gText(e) {
	if (e.button !== 0) return;
	// if (!e.ctrlKey) return;

    // var sel = (document.all) ? document.selection.createRange().text : document.getSelection();
    var sel = document.getSelection();
	var new_t = sel.toString().replace(/\n/g, ' ').trim();
	if (new_t != t) {
		t = new_t;
		if (isMarked) {
			console.log('unmarking because isMarked:', isMarked);
			markInstance.unmark();
			isMarked = 0;
		}

		console.log('t:', t);

		if (t.length > 1) {
			var savedSel = saveSelection(document.documentElement);
			console.log('making now');

			// Determine selected options
		    var options = {
		      iframes: false,
		      caseSensitive: false,
		      ignoreJoiners: true,
		      acrossElements: true,
		      debug: false,
		      separateWordSearch: false,
		      diacritics: false,
			  done: function(cnt) {
				  isMarked = cnt;
				  console.log('isMarked:', cnt);
				  restoreSelection(document.documentElement, savedSel);
			  }
		  }

		    // Remove previous marked elements and mark
		    // the new keyword inside the context
		    markInstance.mark(t.substr(0, t.length), options);
		}
	}


}

document.onmouseup = gText;
// document.onkeyup = gText;
if (!document.all) document.captureEvents(Event.MOUSEUP);
// if (!document.all) document.captureEvents(Event.KEYUP);


// Create an instance of mark.js and pass an argument containing
// the DOM object of the context (where to search for matches)
var markInstance = new Mark(document.documentElement);

// http://stackoverflow.com/a/17694760/1828637
var saveSelection, restoreSelection;

if (window.getSelection && document.createRange) {
    saveSelection = function(containerEl) {
        var doc = containerEl.ownerDocument, win = doc.defaultView;
        var range = win.getSelection().getRangeAt(0);
        var preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(containerEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        var start = preSelectionRange.toString().length;

        return {
            start: start,
            end: start + range.toString().length
        }
    };

    restoreSelection = function(containerEl, savedSel) {
        var doc = containerEl.ownerDocument, win = doc.defaultView;
        var charIndex = 0, range = doc.createRange();
        range.setStart(containerEl, 0);
        range.collapse(true);
        var nodeStack = [containerEl], node, foundStart = false, stop = false;

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType == 3) {
                var nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                    range.setStart(node, savedSel.start - charIndex);
                    foundStart = true;
                }
                if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                    range.setEnd(node, savedSel.end - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        var sel = win.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
} else if (document.selection) {
    saveSelection = function(containerEl) {
        var doc = containerEl.ownerDocument, win = doc.defaultView || doc.parentWindow;
        var selectedTextRange = doc.selection.createRange();
        var preSelectionTextRange = doc.body.createTextRange();
        preSelectionTextRange.moveToElementText(containerEl);
        preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
        var start = preSelectionTextRange.text.length;

        return {
            start: start,
            end: start + selectedTextRange.text.length
        }
    };

    restoreSelection = function(containerEl, savedSel) {
        var doc = containerEl.ownerDocument, win = doc.defaultView || doc.parentWindow;
        var textRange = doc.body.createTextRange();
        textRange.moveToElementText(containerEl);
        textRange.collapse(true);
        textRange.moveEnd("character", savedSel.end);
        textRange.moveStart("character", savedSel.start);
        textRange.select();
    };
}
