/* 
 * Generator for index.html
 */

function isoDateFromString(str) {
    if (str) {
        var d = str.split(/\D/);
        return (new Date(Date.UTC(d[0], --d[1], d[2]))).toISOString();
    } else {
        return "";
    }
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}


function generate(template, state) {

    //Handle the case where odi-certificate-number has not yet been defined (to ensure it's set to display:none)
    if (!state["odi-certificate-number"]) state["odi-certificate-number"] = "";

    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        var value = state[key];

        if (key == "created") {
            var humanReadableDate = value || "";
            var machineReadableDate = isoDateFromString(value);
            template = replaceAll(template,"{"+key+"-human}",humanReadableDate);
            template = replaceAll(template,"{"+key+"-machine}",machineReadableDate);
        } else if (key == "odi-certificate-number") {
            if (value == "") {
                template = replaceAll(template,"{odi-certificate-show}","none");
            } else {
                template = replaceAll(template,"{odi-certificate-show}","inline-block");
            }
            template = replaceAll(template,"{odi-certificate-number}",value);
        } else {
            template = replaceAll(template,"{"+key+"}",value);
        }

      }
    }

    return template;
}

if ('undefined' !== typeof module) {
    //Allow this to be required by node, if server-side
    var exports = module.exports = {};
    exports.generate = generate;
}