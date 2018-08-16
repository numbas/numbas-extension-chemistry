function get_token(str) {
    var token_types = [
        {re: /^\(/, type:'('},
        {re: /^\)/, type:')'},
        {re: /^\d+/, type: 'number'},
        {re: /^[A-Z][a-z]?/, type: 'symbol'}
    ];
    for(var i=0;i<token_types.length;i++) {
        var token_type = token_types[i];
        var m = token_type.re.exec(str);
        if(m) {
            return {str: m[0], type: token_type.type};
        }
    }
}

function tokenise(str) {
    var tokens = [];
    var m;
    var re_token = /^(\(|\)|\d+|[A-Z][a-z]?)/;
    var pos = 0;
    while(pos<str.length) {
        var token = get_token(str.slice(pos));
        if(!token) {
            throw(new Error("Couldn't parse formula "+str+": unexpected character "+str.slice(pos)+" at position "+pos));
        }
        tokens.push(token);
        pos += token.str.length;
    }
    return tokens;
}

/**
 * Data Formula:
 * {type: 'stoichiometry', formula: bracket, n: Number}
 * {type: 'formula', bits: [simple|numbered_bracket]}
 * {type: 'simple', bits: [element]}
 * {type: 'bracket', n: Number, middle: formula},
 * {type: 'element', n: Number, symbol: String}
 */

function parse_formula(str) {
    var tokens = tokenise(str);
    var res = stoichiometry(tokens) || formula(tokens);
    if(res.length==tokens.length) {
        return res.formula;
    }
}

function debug(msg,tokens) {
    console.log(msg,tokens.map(t=>t.str).join(''));
}

function stoichiometry(tokens) {
    if(tokens[0].type=='number') {
        var n = parseInt(tokens[0].str);
        var bracketed = bracket(tokens.slice(1));
        if(bracketed) {
            return {formula: {type: 'stoichiometry', formula: bracketed.formula.middle, n: n}, length: bracketed.length+1};
        }
        var f = formula(tokens.slice(1));
        if(f) {
            return {formula: {type: 'stoichiometry', formula: f.formula, n: n}, length: f.length+1};
        }
    }
}

function formula(tokens) {
    var i = 0;
    var bits = [];
    while(i<tokens.length) {
        var ctokens = tokens.slice(i);
        var bit = simple(ctokens) || numbered_bracket(ctokens) || bracket(ctokens);
        if(!bit) {
            break;
        }
        i += bit.length;
        var f = bit.formula;
        if(bit.formula.type=='bracket' && bit.formula.n==1) {
            f = bit.formula.middle;
        }
        bits.push(f);
    }
    if(bits.length) {
        return {formula: {type: 'formula', bits: bits}, length: i};
    }
}

function simple(tokens) {
    var bits = [];
    var i = 0;
    while(i<tokens.length) {
        var bit = element(tokens.slice(i));
        if(!bit) {
            break;
        }
        bits.push(bit.formula);
        i += bit.length;
    }
    if(bits.length) {
        return {formula: {type: 'simple', bits: bits}, length: i};
    }
}

function numbered_bracket(tokens) {
    var bracketed = bracket(tokens);
    if(!bracketed) {
        return;
    }
    if(tokens.length>=bracketed.length+1 && tokens[bracketed.length].type=='number') {
        return {formula: {type: 'bracket', n: parseInt(tokens[bracketed.length].str), middle: bracketed.formula.middle}, length: bracketed.length+1};
    }
}

function bracket(tokens) {
    if(tokens.length<1 || tokens[0].type!='(') {
        return;
    }
    var middle = formula(tokens.slice(1));
    if(!middle) {
        return;
    }
    if(tokens.length<middle.length+2 || tokens[middle.length+1].type!=')') {
        return;
    }
    return {formula: {type: 'bracket', n: 1, middle: middle.formula}, length: middle.length+2};
}

function element(tokens) {
    if(tokens.length==0 || tokens[0].type!='symbol') {
        return ;
    }
    if(tokens.length>=2 && tokens[1].type=='number') {
        return {formula: {type: 'element', n: parseInt(tokens[1].str), symbol: tokens[0].str}, length: 2};
    } else {
        return {formula: {type: 'element', n: 1, symbol: tokens[0].str}, length: 1};
    }
}


function count_atoms(formula) {
    var d = {};
    switch(formula.type) {
        case 'stoichiometry':
            Object.entries(count_atoms(formula.formula)).forEach(function(e) {
                d[e[0]] = formula.n * e[1];
            });
            break;
        case 'formula': 
            formula.bits.forEach(function(b) {
                Object.entries(count_atoms(b)).forEach(function(e) {
                    d[e[0]] = (d[e[0]] || 0) + e[1];
                });
            });
            break;
        case 'simple':
            formula.bits.forEach(function(b) {
                d[b.symbol] = (d[b.symbol] || 0) + b.n;
            });
            break;
        case 'bracket':
            Object.entries(count_atoms(formula.middle)).forEach(function(e) {
                d[e[0]] = formula.n * e[1];
            });
            break;
        case 'element':
            d[formula.symbol] = formula.n;
            break;
        default:
            throw(new Error("Not a formula"));
    }
    return d;
}

function formula_renderer(sub,symbol) {
    sub = sub || function(n){return n+'';};
    symbol = symbol || function(n){return n+'';};
    var render = function(formula,use_subscript) {
        switch(formula.type) {
            case 'stoichiometry':
                return formula.n+'('+render(formula.formula)+')';
            case 'formula': 
                return formula.bits.map(render).join('');
            case 'simple':
                return formula.bits.map(render).join('');
            case 'bracket':
                return '('+render(formula.middle)+')' + (formula.n==1 ? '' : sub(formula.n));
            case 'element':
                return symbol(formula.symbol) + (formula.n==1 ? '' : sub(formula.n));
            default:
                throw(new Error("Not a formula"));
        }
    }
    return render;
}
var display_formula = formula_renderer(subscript);
var formula_to_string = formula_renderer();
var formula_to_tex = formula_renderer(function(n){ return '_{'+n+'}'; }, function(s){return '\\mathrm{'+s+'}'});

