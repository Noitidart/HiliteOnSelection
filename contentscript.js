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
			  }
		  }

		    // Remove previous marked elements and mark
		    // the new keyword inside the context
		    markInstance.mark(t.substr(0, t.length-1), options);
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
