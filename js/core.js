const prefix = ""
const postfix = "$"

defineObjProtoFunc$ = (objConstructors, name, func) => {
    objConstructors = Array.isArray(objConstructors) ? objConstructors : [objConstructors]

    objConstructors.forEach(c => {
        let f = func instanceof Function ? func : c.prototype[func];
        Object.defineProperty(c.prototype, prefix + name + postfix, {
            value: f
        })
    })
}

defineObjProtoFunc$(Object, 'isString', function () {
    return typeof (this.valueOf()) === "string"
})

defineObjProtoFunc$(Object, 'insert', function (index, ...items) {
    return this.splice(index, 0, ...items);
})
defineObjProtoFunc$(NodeList, 'toArray', function () {
    let arr = [],
        i = 0,
        l = this.length;
    while (i !== l) arr[i] = this[i++];
    return arr;
})
defineObjProtoFunc$(Object, 'forEach', function (func, asDict) {
    let result = asDict === undefined ? [] : {}
    if (this.forEach) {
        this.forEach((v, k) => {
            let r = func(v, k, this);
            if (asDict === undefined) {
                result.push(r)
            } else {
                result[r[asDict === null ? key : asDict]] = r;
            }
        })
    } else {
        for (let key in this) {
            let r = func(this[key], key, this);
            if (asDict === undefined) {
                result.push(r)
            } else {
                result[r[asDict === null ? key : asDict]] = r;
            }
        }
    }
    return result
})
defineObjProtoFunc$(Object, 'get', function (key, def = null) {
    return this[key] === undefined ? def : this[key]
})
const htmlElements = [NodeList, HTMLElement, HTMLDocument]

class NodeList$ extends NodeList {
    item(i) {
        return this[+i || 0];
    }
}
const canReturn = ['attr', 'css', 'prop']
defineHtmlProtoFunc$ = (name, func) => {
    let cr = canReturn.indexOf(name) >= 0;
    htmlElements.forEach(c => {
        defineObjProtoFunc$(c, name, c.prototype.forEach ? function (...args) {
            args = cr ? returnTypeCbeck(...args) : args
            let results = this.forEach$(n => n[prefix + name + postfix](...args))
            return (cr && !args[2] || args.length == 0) ? results : Reflect.construct(Array, results, NodeList$)
        } : func)
    })
}
defineObjProtoFunc$(NodeList, 'each', function (func) {
    this.forEach((n, i, a) => func(n, i, a));
    return this;
})
defineObjProtoFunc$(htmlElements, 'q', "querySelectorAll")

defineHtmlProtoFunc$('on', function (eventName, func) {
    this.addEventListener(eventName, func)
    return this;
})

const returnTypeCbeck = function (name, value) {
    if (arguments.length > 2) return arguments
    if (arguments.length == 0) return [null, 'all', false, arguments]
    let type = Array.isArray(name) ? "list" : (!name.isString$() ? "dict" : "string")
    let args = {}
    let set = arguments.length > 1
    switch (type) {
        case "list":
            name.forEach(v => args[v] = set ? (value || []).get$(k, undefined) : null)
            break;
        case "dict":
            args = name;
            set = true;
            break;
        case "string":
            args = {};
            args[name] = set ? value : undefined
            break;
    }
    return [args, type, set, arguments]
}
defineHtmlProtoFunc$('attr', function () {
    var [args, type, set, orig] = returnTypeCbeck(...arguments)
    if (!set) {
        if (type == "all") return this.attributes.forEach$(a => a.nodeValue, 'nodeName');
        return type == "list" ? orig[0].map(n => this.getAttribute(n)) : this.getAttribute(orig[0]);
    }
    args.forEach$((v, k) => this.setAttribute(k, v))
    return this;
});
defineHtmlProtoFunc$('css', function () {
    var [args, type, set, orig] = returnTypeCbeck(...arguments)
    if (!set) {
        if (type == "all") return this.styles.forEach$(a => a.nodeValue, 'nodeName');
        return type == "list" ? orig[0].map(n => this.style[n]) : this.style[orig[0]];
    }
    args.forEach$((v, k) => this.style[k] = v)
    return this;
});
defineHtmlProtoFunc$('prop', function () {
    var [args, type, set, orig] = returnTypeCbeck(...arguments)
    if (!set) {
        if (type == "all") return this.forEach$(v => v, null);
        return type == "list" ? orig[0].map(n => this[n]) : this[orig[0]];
    }
    args.forEach$((v, k) => this[k] = v)
    return this;
});
defineHtmlProtoFunc$('func', function (name, ...args) {
    this[name](...args);
    return this;
})
defineHtmlProtoFunc$('html', function (html) {
    return this.prop('innerHTML', html)
})
defineHtmlProtoFunc$('text', function (text) {
    return this.prop('textContent', text)
})
defineHtmlProtoFunc$('val', function (val) {
    return this.prop('value', val)
})
defineHtmlProtoFunc$('appendTo', function (parent) {
    let p = getHtmlElf(parent);
    this.forEach(c => p.append(c));
    return this;
});
defineHtmlProtoFunc$('append', function (...childs) {
    let p = this;
    childs.forEach(c => {
        let all = getHtmlElf(c);
        (all.forEach ? all : [all]).forEach(c => p.appendChild(c))
    })
    return this;
});
defineHtmlProtoFunc$('trigger', function (name, opts) {
    let event = new CustomEvent(name, opts);
    this.dispatchEvent(event);
    return this;
})
const getHtmlElf = (obj, root = document) => {
    let nodes = [];
    if (obj === undefined || obj === null) return Reflect.construct(Array, [], NodeList$);
    for (let i in htmlElements) {
        if (obj instanceof htmlElements[i]) return obj;
    }
    if (obj.isString$()) {
        let str = obj.trim();
        if (str[0] === "<") {
            obj = root.createRange().createContextualFragment(str).childNodes;
        } else {
            obj = root.querySelectorAll(str);
        }
        return obj
    }
    return Reflect.construct(Array, [], NodeList$);
}