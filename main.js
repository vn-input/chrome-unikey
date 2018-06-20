var ime_api = chrome.input.ime;
var context_id = -1;
var input_chars; // switch chars need capture by current input method
var shift_had_pressed = false;

var unikey = new Module.SimpleUnikey();

ime_api.onFocus.addListener(function(context) {
    context_id = context.contextID;
    unikey.reset()
});

ime_api.onActivate.addListener(function(engineID) {
    if (engineID == "unikey-telex") {
        input_chars = /^[a-zA-Z]$/;
        unikey.set_input_method(Module.InputMethod.TELEX);
    } else {
        input_chars = /^[a-zA-Z0-9]$/;
        unikey.set_input_method(Module.InputMethod.VNI);
    }
});

ime_api.onBlur.addListener(function(contextID) {
    context_id = -1
});

var update_composition = function() {
  var r = unikey.get_result();
  ime_api.setComposition({
    "contextID": context_id,
    "text": r,
    "cursor": r.length,
  });
}

ime_api.onKeyEvent.addListener(function(engineID, keyData) {
  if (keyData.type != "keydown") {
    if (keyData.key == "Shift") {
      shift_had_pressed = false;
    }
    return false;
  }

  if (keyData.key == "Shift") {
    if (shift_had_pressed && unikey.get_result() != "") {
      unikey.restore();
      update_composition();
    } else {
      shift_had_pressed = true;
    }
    return false;
  }

  if (keyData.key == "Backspace" && unikey.get_result() != "") {
    unikey.process_backspace();
    update_composition();
    return true;
  }

  //console.log(keyData);

  if (!keyData.ctrlKey && keyData.key.match(input_chars)) {
    unikey.process_char(keyData.key.charCodeAt(0));
    var r = unikey.get_result();
    ime_api.setComposition({
      "contextID": context_id,
      "text": r,
      "cursor": r.length,
    });
    return true;
  }

  if (keyData.code.match(/(AudioVolume|Brightness)/)) {
    return false;
  }

  ime_api.commitText({
    "contextID": context_id,
    "text": unikey.get_result(),
  });
  unikey.reset();

  return false;
});

